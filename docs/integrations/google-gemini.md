# Integration — Google Gemini

The only external AI dependency. Used for three things in the live path: OCR, document classification
and field extraction — plus embeddings for retrieval.

## Configuration

| Variable | Required | Default | Purpose |
| -------- | -------- | ------- | ------- |
| `GOOGLE_API_KEY` | **Yes** | — | API key |
| `GOOGLE_AI_MODEL` | No | `gemini-2.0-flash` | Chat model id |

```python
# app/utils/kyc_document_parser.py:25-37
GOOGLE_API_KEY  = env("GOOGLE_API_KEY").strip().strip('"')
GOOGLE_AI_MODEL = env("GOOGLE_AI_MODEL", default="gemini-2.0-flash")

llm = ChatGoogleGenerativeAI(model=GOOGLE_AI_MODEL, ...)
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
```

Both clients are constructed at **import time**, so a missing or malformed key prevents the backend
from starting — even for endpoints that never call the model. `.strip().strip('"')` tolerates a key
accidentally wrapped in quotes.

SDKs in play: `langchain-google-genai==4.1.2` (the live path) and `google-genai==1.56.0` (the newer
direct SDK, present in `requirements.txt`).

## Usage 1 — OCR

[`ocr_extract_text`](../../backend/app/utils/kyc_document_parser.py) dispatches on file type:

| Input | Handling | Gemini calls |
| ----- | -------- | -----------: |
| PDF | PyMuPDF opens the document; each page is rendered to a PIL image via `Image.frombytes` and sent to Gemini Vision (`ocr_pdf_with_langchain`) | **one per page** |
| Image | Base64-encoded and sent directly (`ocr_image_with_langchain`) | 1 |
| DOCX | `python-docx` reads paragraphs | **0** |

> Unlike some implementations, PDFs are **not** checked for an embedded text layer first — every page
> is rendered and sent to the model. A 10-page PDF costs 10 vision calls even if it is born-digital.
> This is the dominant cost driver.

## Usage 2 — Classification and extraction

A single call does both. The prompt (`extract_details`) is strict:

- **STRICT JSON ONLY** — no markdown, comments or explanations
- Do **not** hallucinate; absent fields become `""` or `null`
- Return `name` and `address` **in English**, transliterating other scripts
- Return `doc_number` with **all whitespace removed**

Classes: `aadhaar_card` · `pan_card` · `resume` · `address_proof` · `qualification` · `other`.

Output is an 18-field schema — see [../modules/kyc.md](../modules/kyc.md).

Response cleanup is handled by `clean_gemini_json`, which strips fences and extracts the JSON object.
On any parse failure `extract_details` returns a stub with `document_type: "other"` and the raw output
under `extra.raw_output` — **a successful API response containing no usable data.**

## Usage 3 — Embeddings

`models/text-embedding-004` via `embeddings.embed_query(text)` in `gen_embedding`. Called once per
chunk at index time and once per query at search time.

```python
def gen_embedding(text: str):
    if not text or not text.strip():
        raise ValueError("Embedding text cannot be empty")
    return embeddings.embed_query(text)
```

## Model inventory across the codebase

| Model | Where | Status |
| ----- | ----- | ------ |
| `GOOGLE_AI_MODEL` (default `gemini-2.0-flash`) | `kyc_document_parser.py` | ✅ live |
| **`models/text-embedding-004`** | `kyc_document_parser.py:37` | ✅ live |
| `gemini-2.0-flash`, `temperature=0.3` | `vector/kyc_chroma_service.py:11` | ❌ module unused |
| `models/embedding-001` | `vector/kyc_chroma_service.py:10`, `services/vector_db.py:12` | ❌ dead paths |

> **Two different embedding models are configured.** Vectors produced by `text-embedding-004` and
> `embedding-001` are not comparable. Re-enabling a dead path against the live collection would produce
> meaningless similarity scores. [AUDIT.md](../../AUDIT.md) issue 14.

`services/gemini_service.py` (172 lines) provides `ask_gemini_for_json_string` for the Policy module —
unreachable, since nothing imports `rag_service`.

## Cost and quota

Nothing meters, caches, throttles or logs model usage.

| Operation | Gemini calls |
| --------- | -----------: |
| Upload a DOCX | 1 (extraction) + 1 embedding |
| Upload an image | 1 (OCR) + 1 (extraction) + 1 embedding |
| Upload an *n*-page PDF | **n** (OCR) + 1 (extraction) + 1 embedding |
| Search query | 1 embedding |

Because authentication is a single shared token, **any holder of that token can consume your quota**.

## Failure modes

| Failure | Behaviour |
| ------- | --------- |
| Key missing or malformed | **Backend fails to start** — clients build at import |
| Key invalid / quota exceeded | Exception at call time → HTTP 500 |
| Network failure | Same — **no retry, no timeout, no circuit breaker** |
| Model returns non-JSON | `clean_gemini_json` salvages what it can; on failure a stub is returned and **saved** with `document_type: "other"` |
| Empty embedding text | `ValueError("Embedding text cannot be empty")` |

The fourth is the one to watch: a failed extraction is indistinguishable from a genuinely
unclassifiable document, and the record is persisted either way.
[AUDIT.md](../../AUDIT.md) issue 21.

## Data sent to Google

Be deliberate. This integration transmits **the full contents of every uploaded KYC document** —
PAN cards, Aadhaar cards, resumes, address proofs and qualification certificates — as images or text,
plus every search query.

Nothing redacts anything, and there is no configuration flag to disable it. For a KYC product this is a
data-residency and privacy decision that should be made explicitly, not inherited by default. India's
DPDP Act and comparable regimes treat Aadhaar and PAN as sensitive personal data.

## Changing the model

```ini
GOOGLE_AI_MODEL = gemini-2.0-flash
```

Applies to the chat model only. The embedding model is **hard-coded** at
`kyc_document_parser.py:37` — changing it requires a code edit **and** a full re-index, for which no
command exists.

## Known limitations

1. **No timeout and no retry** on any call.
2. **PDFs always cost one vision call per page** — no text-layer shortcut.
3. **No caching** — re-uploading the same document costs the same again.
4. **Extraction failures are persisted silently.**
5. **Two embedding models** configured across live and dead paths.
6. **No usage tracking or rate limiting**, on a shared-token system.
7. **The embedding model is hard-coded**, and there is no re-index path.
8. **Fails closed at startup** — no key means no backend, even for endpoints that never use it.
