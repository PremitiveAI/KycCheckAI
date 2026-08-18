# Integration — ChromaDB

The vector store behind KYC document retrieval. Runs **embedded** — in-process, against a local
directory. There is no server to install or start.

`chromadb==1.3.7`, pinned in `requirements.txt`.

## Three implementations, one live

| Module | Client | Location | Collection | Status |
| ------ | ------ | -------- | ---------- | ------ |
| [`app/vector/vector_db.py`](../../backend/app/vector/vector_db.py) | `chromadb.PersistentClient` (native SDK) | `./vector_db` | default | ✅ **LIVE** |
| [`app/services/vector_db.py`](../../backend/app/services/vector_db.py) | LangChain `Chroma` | `./chroma_store` | `pdf_chunks` | ❌ used only by the unreferenced `rag_service` |
| [`app/vector/kyc_chroma_service.py`](../../backend/app/vector/kyc_chroma_service.py) | LangChain `Chroma` | `CHROMA_DIR` | default | ❌ imported by nothing |

Only the first participates in the working product. The other two are documented so they are not
mistaken for it. [AUDIT.md](../../AUDIT.md) issue 12.

## The live store

```python
class VectorStore:
    def __init__(self, path: str = "./vector_db"):
        self.client = chromadb.PersistentClient(path=path)
        self.collection = self.client.get_or_create_collection(...)
        print("➡️ Total stored vectors =", self.collection.count())

vector_db = VectorStore()          # module-level singleton
print("🔥 Global Vector DB Loaded — Count =", vector_db.collection.count())
```

Two properties worth noting:

- **`get_or_create_collection`** — the collection is **not** destroyed on restart. Indexed documents
  survive reboots and `--reload` cycles.
- **Module-level singleton** — the client opens as the module imports, so the count prints on every
  start and every reload.

Embeddings come from Google `models/text-embedding-004`, generated outside Chroma by `gen_embedding`
and passed in explicitly — Chroma is used purely as storage and search, with no embedding function
attached.

### API

| Method | Purpose |
| ------ | ------- |
| `add_vector(vector, metadata, document_details)` | Upsert; logs collection count before and after |
| `search(query_vector, top_k, where)` | Filtered similarity search |
| `build_where_filter(filters)` | Translates a flat dict into Chroma's filter syntax |
| `search_with_advanced_filters(...)` | Extended variant |
| `delete_by_ids(ids)` | Delete by Chroma id |
| `delete_by_document(document_id)` | Delete by `document_id` metadata |
| `delete_by_filter(where)` | Delete by arbitrary filter |
| `get_by_ids(ids, include)` | Direct fetch |
| `_ensure_python_floats(vec)` | Coerces numpy floats before insertion — Chroma rejects them |

The three delete methods exist but **no route calls any of them**, so removing an employee leaves their
vectors searchable. [AUDIT.md](../../AUDIT.md) issue 15.

### Metadata schema

`build_vector_payload(userId, employee_id, record_id, details)` produces the filterable metadata:

| Key | Purpose |
| --- | ------- |
| `userId` | Tenant filter — currently the hard-coded constant |
| `employee_id` | Which employee |
| `record_id` | Row id in the typed document table |
| `document_type` | `pan_card`, `aadhaar_card`, … |
| `full_name` | Lower-cased, used for the fuzzy re-rank |
| `aadhaar_number`, `pan_number` | Exact-match filters |

The Chroma "document" string holds the serialised extracted payload, so search results carry the data
without a database round trip.

### Query pattern

```python
where = {"userId": user_id.lower()}
if parsed.get("document_type"): where["document_type"] = parsed["document_type"]
...
hits = vector_db.search(query_vector=query_vec, top_k=50, where=where)
```

Metadata filtering happens **before** similarity ranking, so a query naming a document type narrows the
candidate set first. Detail: [../modules/document-rag.md](../modules/document-rag.md).

## The two dead stores

### `app/services/vector_db.py`

LangChain `Chroma` with collection `pdf_chunks`, persisted to `./chroma_store`, embeddings from
`models/embedding-001`. Exposes `store_document`, `search_vectors`, `get_file_hash_from_text`. Used
only by `rag_service`, which nothing imports. Belongs to the [Policy module](../modules/policy.md).

### `app/vector/kyc_chroma_service.py`

LangChain `Chroma` at `CHROMA_DIR`, `models/embedding-001`, `gemini-2.0-flash` at `temperature=0.3`,
and — notably — a sensible splitter:

```python
splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
```

This is the chunking strategy the live path should adopt; it currently uses `chunk_text(size=50_000)`
with no overlap. [AUDIT.md](../../AUDIT.md) issue 18.

It also calls `db.persist()` at line 31 — **removed from Chroma in 0.4.x**, and `requirements.txt` pins
1.3.7. The module would raise `AttributeError` if wired in. [AUDIT.md](../../AUDIT.md) issue 13.

## Operations

| Concern | Reality |
| ------- | ------- |
| Startup | Nothing to start — embedded |
| Persistence | `backend/vector_db/` — back it up with the database |
| Rebuild | **No re-index command exists.** Losing the directory means re-uploading every document |
| Deletion | Methods exist; no route calls them |
| Scaling | Single-process embedded mode; two backend instances would each hold their own client against the same directory, which Chroma does not support for concurrent writes |
| Monitoring | Collection count printed at startup and around each insert |

## Known limitations

1. **No re-index path** from MySQL to the vector store.
2. **Deletion is not wired**, so removed employees remain searchable.
3. **Chunking is effectively disabled** in the live path.
4. **Three implementations, two embedding models** — vectors are not interchangeable.
5. **Embedded mode does not support multiple writer processes** — relevant if the backend is ever
   scaled horizontally.
6. **No volume declared in the Dockerfile**, so a containerised run loses the index on removal. See
   [../setup/docker.md](../setup/docker.md).
