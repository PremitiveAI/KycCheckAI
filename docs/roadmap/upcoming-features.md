# Upcoming Features

Features with frontend implementation and no backend counterpart. Documented here rather than as
delivered features, because none of them function today.

Everything below is **verified from the current implementation** — these are real files and real API
calls, not speculation about intent.

---

## Real Estate — Excel upload and search

Presented in the sidebar as a top-level module: **Real Estate → Upload File · Search**.

### What exists

| Layer | File | Status |
| ----- | ---- | ------ |
| Page | `app/(auth)/upload-excel/page.tsx` | ✅ built — file picker, upload handler, toast feedback |
| Page | `app/(auth)/search-excel/page.tsx` | ⚠️ 17-line stub — iframes `http://localhost:8000` |
| Page | `app/(auth)/excel-list/page.tsx` | ⚠️ calls handlers that do not exist |
| Handler | `app/api/upload-excel/route.ts` | ✅ built — POSTs to `${API_URL}upload_excel/` |
| Dependency | `xlsx@0.18.5` | ✅ installed and imported |
| **Backend** | — | ❌ **no `upload_excel` endpoint exists** |

### Why it does not work

`/api/upload-excel` targets `upload_excel/`. No router with that path is registered — or present
anywhere in `backend/app/routes/`.

`excel-list/page.tsx` calls `/api/query/RES-1001` and `/api/query/RES-1002` — handlers that do not
exist, with **hard-coded record IDs**, suggesting the page was built against a mock.

`search-excel/page.tsx` is byte-identical to `employee/search-employee-doc/page.tsx`: both embed an
iframe pointing at `http://localhost:8000` — the FastAPI port, not a search UI — and both are titled
"PolicyForYou AI".

### To complete it

1. Define the backend contract — what an uploaded spreadsheet represents and what is extracted.
2. Implement `POST /upload_excel/` (or rename the frontend target to match house convention, e.g.
   `/excel/upload`).
3. Decide whether rows are persisted relationally, embedded for retrieval, or both.
4. Replace `excel-list`'s hard-coded IDs with a real list endpoint.
5. Replace the `search-excel` iframe stub with a real search page.

---

## Chainlit search

Presented as a top-level sidebar item: **Search**.

### What exists

| Layer | File | Status |
| ----- | ---- | ------ |
| Page | `app/(auth)/chainlit/search/page.tsx` | ✅ built |
| Handler | `app/api/chainlit/search/route.ts` | ✅ built — calls `${API_URL}KYC/search?query=…` |
| Backend | `GET /KYC/search` | ✅ **exists and works** |

### Status: working, but not Chainlit

Despite the name, this route does **not** integrate [Chainlit](https://chainlit.io/). It is a
conventional Next.js page calling the live KYC search endpoint, which returns structured records — not
a chat interface, and with no LLM generation step.

There is **no Chainlit dependency** in `package.json` or `requirements.txt`, and no Chainlit server
configuration anywhere in the repository.

The two pages that *do* iframe `http://localhost:8000` (`search-excel`,
`employee/search-employee-doc`) appear to be aiming at an embedded Chainlit app on that port — but 8000
is the FastAPI port, and FastAPI serves the JSON API there, not a chat UI.

### To complete it

Either:

- **Rename it.** The feature works; calling it "Chainlit" is misleading. `/search/documents` would
  describe it accurately.
- **Or actually integrate Chainlit** — add the dependency, run it on its own port, and point the two
  iframe stubs at that port instead of 8000.

---

## The `documents/*` module

Presented in the sidebar as **KYC → Upload document · History · Search**. This is the naming inversion
described in [../api/frontend-contract-map.md](../api/frontend-contract-map.md): the menu labelled
"KYC" is the one without a backend.

### What exists

| Layer | File | Status |
| ----- | ---- | ------ |
| Pages | `upload-document`, `document-history`, `search-document` | ✅ built |
| Handlers | `upload-document`, `search-doc`, `deleteDoc/[documentId]`, `downloadDoc` | ✅ built |
| Backend | — | ❌ **no `documents/*` router exists** |
| Database | `tbl_documents`, `tbl_document_vectors` | ✅ **tables exist** |
| Repository | `app/repositories/document_repository.py` | ✅ exists |

The database schema for this module is already in place — `tbl_documents` with a FK to `tbl_users.userId`
and a cascading relationship to `tbl_document_vectors`. Only the router and service layer are missing.

### To complete it

1. Decide whether this duplicates the working `/KYC/*` module or serves a distinct purpose (user-owned
   documents, as the `tbl_users.userId` FK suggests, versus employee-owned documents in the KYC path).
2. If distinct: implement `documents/upload`, `documents/search`, `documents/{id}` (DELETE) and
   `documents/download`, reusing `document_repository`.
3. If duplicative: retire the three pages and four handlers, and fold them into the Employee menu.

Given that `tbl_documents` keys on `userId` while the KYC tables key on `emp_id`, these look like
genuinely different features — self-service document upload versus HR-managed employee KYC.

---

## Policy module

Not upcoming so much as **built and switched off** — a complete RAG pipeline with generation, language
detection and translation, disabled at `main.py` and carrying four defects.

It has its own document: [../modules/policy.md](../modules/policy.md).

---

## Summary

| Feature | Frontend | Backend | DB | Blocking work |
| ------- | :------: | :-----: | :-: | ------------- |
| Real Estate / Excel | ✅ | ❌ | ❌ | Define and implement the whole backend |
| Chainlit search | ✅ | ✅ | ✅ | Rename, or add a real Chainlit integration |
| `documents/*` | ✅ | ❌ | ✅ | Implement router + service, or retire |
| Policy | ✅ | ⚠️ built, disabled | ✅ | Fix four defects, re-enable |

Only **Chainlit search** works today, and only because it quietly calls the KYC endpoint.
