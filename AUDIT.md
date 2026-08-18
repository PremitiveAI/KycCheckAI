# Code Audit — Confirmed Issues

Every item was verified by reading the source. Each cites a file and, where useful, a line.

**Scope of verification.** All 75 backend Python files inventoried; `main.py`, all 9 route files, all 16
models, all 13 schemas, the middleware, the KYC and RAG services, both vector layers and the extraction
prompt read directly. All 96 frontend files read, including every one of the 29 route handlers and 26
pages. The application was **not executed**, and the live MySQL schema was **not inspected**.

**Total: 26 confirmed issues.**

> **Two items retracted from an earlier draft.** `TOKEN_SECRET` and `API_TOKEN` were reported as absent
> from `.env`, making the backend unstartable. That was wrong — a search pattern required `KEY=` while
> the file uses `KEY = value` with spaces, which `python-dotenv` handles correctly. Both variables are
> present. The backend starts and authentication resolves.

| Category | Count |
| -------- | ----: |
| [Security & access control](#security--access-control) | 5 |
| [Frontend↔backend contract](#frontendbackend-contract) | 5 |
| [Broken or dead code](#broken-or-dead-code) | 7 |
| [RAG & data quality](#rag--data-quality) | 4 |
| [Setup & operations](#setup--operations) | 5 |

---

## Security & access control

### 1. `userId` is hard-coded on both KYC endpoints — **High**

- **Evidence:** [`app/routes/kyc_routes.py:59`](backend/app/routes/kyc_routes.py) —
  `userId = "U-98WZ41BUTTOM" #request.state.userId`, and line 65 —
  `request.state.userId = "U-98WZ41BUTTOM"`, which **overwrites** whatever the middleware set.
- **Impact:** Every uploaded document is stored under one tenant directory and tagged with one
  `userId` in ChromaDB metadata. `handle_search_documents` filters `where={"userId": user_id.lower()}`,
  so all users see all documents. Multi-tenancy is defeated at both write and read.
- **Recommendation:** Use `request.state.userId` from the session, and remove the override on line 65.

### 2. Uploaded identity documents are served without authentication — **High**

- **Evidence:** [`app/main.py:50`](backend/app/main.py) —
  `app.mount("/storage", StaticFiles(directory="storage"), name="storage")`. Uploads land in
  `storage/{userId}/{employee_id}/` and the directory already contains real data under
  `storage/U-98WZ41BUTTOM/` and `storage/U-UCLHKV1IAPK8/`.
- **Impact:** PAN cards, Aadhaar cards, resumes, address proofs and qualification certificates are
  downloadable by anyone who can reach the backend, with no credential. Paths are guessable because the
  `userId` is a fixed constant.
- **Recommendation:** Serve these through an authenticated handler, or block `/storage` at the proxy.

### 3. Logout never invalidates the server-side session — **High**

- **Evidence:** [`frontend/app/api/logout/route.ts`](frontend/app/api/logout/route.ts) builds an axios
  `config` object targeting `${API_URL}logout`, then **never executes it**. It deletes cookies and
  returns `{Success: "API call success"}`.
- **Impact:** The `tbl_users_sessions` row stays `status=1` indefinitely. A captured token remains
  valid after the user believes they have logged out. The target path is also wrong — the backend
  exposes `user/logout`, not `logout`.
- **Recommendation:** Actually issue the request, and correct the path.

### 4. No route guard on the frontend — **Medium**

- **Evidence:** No `middleware.ts` anywhere; a single `app/layout.tsx`. `(auth)` and `(main)` are
  Next.js route groups, which affect URLs only.
- **Impact:** Every page renders for an unauthenticated visitor. Protection exists only inside the API
  handlers that read the `session_token` cookie — so pages load, then fail to populate.
- **Recommendation:** Add `middleware.ts` matching the `(auth)` routes.

### 5. All errors return HTTP 200 — **Medium**

- **Evidence:** [`app/utils/response.py`](backend/app/utils/response.py) — `success_response`,
  `error_response` and `throw_error_response` all use `status_code=200`.
- **Impact:** Monitoring and generic retry logic cannot distinguish success from failure. Several
  frontend handlers only check `res.ok`, so backend errors surface as empty screens.

---

## Frontend↔backend contract

Only **12 of 29** frontend route handlers reach a live backend endpoint. Full table:
[docs/api/frontend-contract-map.md](docs/api/frontend-contract-map.md).

### 6. Four handlers omit the `user/` prefix — **High**

- **Evidence:** `change-password` → `update-password`; `generate-otp` → `generate-otp`;
  `validate-otp` → `validate-otp`; `logout` → `logout`. The backend registers all four under
  `/user` ([`app/routes/login_routes.py`](backend/app/routes/login_routes.py)).
- **Impact:** Password change, OTP generation, OTP validation and logout all 404. These are core
  account flows.
- **Recommendation:** One-character fix per handler — prefix `user/`.

### 7. Five handlers target commented-out routers — **High**

- **Evidence:** `upload` and `downloadPdf` target `upload.py`; `policy-list`, `policyDetail` and
  `search` target `query.py`. Both are commented out at
  [`app/main.py:9-11, 29-30`](backend/app/main.py).
- **Impact:** The entire Policy module UI is non-functional.

### 8. Seven handlers have no backend at all — **High**

- **Evidence:** `upload-document`, `search-doc`, `deleteDoc` and `downloadDoc` all target a
  `documents/*` router that does not exist. `upload-excel` targets `upload_excel/`. `user-list` targets
  `/employee/list`. `employee/employee-upload` targets `document/upload?project_id=` instead of
  `KYC/upload`.
- **Impact:** The sidebar module labelled "KYC" is entirely non-functional, as is Real Estate and the
  user list.

### 9. `user-list` also double-slashes its URL — **Low**

- **Evidence:** [`frontend/app/api/user-list/route.ts:27`](frontend/app/api/user-list/route.ts) —
  `` `${API_URL}/employee/list` `` without the `.replace(/\/$/, "")` used elsewhere.
- **Impact:** Yields `…8000//employee/list` when `API_URL` ends with a slash.

### 10. Two pages call handlers that do not exist — **Medium**

- **Evidence:** `employee/upload-employee-doc:356` → `/api/employee-document/`;
  `excel-list:35,51` → `/api/query/RES-1001` and `/api/query/RES-1002` with hard-coded IDs.

---

## Broken or dead code

### 11. `rag_service.py` contains four defects and is imported by nothing — **High**

- **Evidence:** [`app/services/rag_service.py`](backend/app/services/rag_service.py):

  | Defect | Location |
  | ------ | -------- |
  | Five broken imports — `from services.X` instead of `from app.services.X` | 16, 17, 162, 192, 237 |
  | Infinite recursion — `get_relevant_pdf_for_query` calls itself inside its own loop | 12-37 |
  | A 60-line `json_prompt` is built then **never used**; `ask_gemini_for_json_string(context, english_query)` is called instead | 66-131 vs 134 |
  | `return stored_json` sits inside the loop and is unreachable when the guard fails | 35 |

- **Impact:** Were the Policy module re-enabled, it would fail immediately.

### 12. Three vector-store implementations, two dead — **Medium**

| Module | Technology | Status |
| ------ | ---------- | ------ |
| [`app/vector/vector_db.py`](backend/app/vector/vector_db.py) | `chromadb.PersistentClient` → `./vector_db` | ✅ live |
| [`app/services/vector_db.py`](backend/app/services/vector_db.py) | LangChain `Chroma`, collection `pdf_chunks` → `./chroma_store` | ❌ used only by dead `rag_service` |
| [`app/vector/kyc_chroma_service.py`](backend/app/vector/kyc_chroma_service.py) | LangChain `Chroma` + `RecursiveCharacterTextSplitter(800, 150)` | ❌ imported by nothing |

### 13. `kyc_chroma_service` calls an API removed from Chroma — **Medium**

- **Evidence:** line 31 — `db.persist()`. Removed in `chromadb` ≥ 0.4.x; `requirements.txt` pins
  **1.3.7**.
- **Impact:** `store_document` would raise `AttributeError` if the module were ever wired in.

### 14. Two embedding models are configured for the same purpose — **Medium**

- **Evidence:** the live path uses `models/text-embedding-004`
  ([`kyc_document_parser.py:37`](backend/app/utils/kyc_document_parser.py)); both dead modules use
  `models/embedding-001`.
- **Impact:** Vectors written by different code paths are not comparable. Re-enabling a dead path
  against the live collection would silently produce meaningless similarity scores.

### 15. Five backend services are unreferenced — **Medium**

- **Evidence:** no registered route reaches `rag_service.py`, `user_db.py` (599 lines),
  `pdf_reader.py`, `translator_service.py` or `list_service.py`. Marked
  **potentially unreferenced — requires confirmation** for the latter four, which were traced from
  `main.py` but not from every controller.

### 16. `session_model.py` is entirely commented out — **Low**

- **Evidence:** [`app/models/session_model.py`](backend/app/models/session_model.py) — every line is a
  comment. Session persistence is handled by `users_session_model`, `admin_session_model` and
  `employee_session_model`.

### 17. Eight of twelve frontend components are unused — **Low**

- **Evidence:** `AuthBackground`, `DocumentUpload`, `EmployeeRow`, `PolicyDetailsAccordionItem`,
  `StatCard`, `StatusBadge`, `dynamic-input`, `logout` have no importers. `networkFetch`,
  `data-dummy` and `lib/data` are likewise unused.

---

## RAG & data quality

### 18. Chunking is effectively disabled — **Medium**

- **Evidence:** [`app/services/kyc_document_service.py:36`](backend/app/services/kyc_document_service.py) —
  `def chunk_text(text: str, size=50_000)` with **no overlap**.
- **Impact:** At 50,000 characters virtually every KYC document becomes a single chunk, so retrieval
  operates at whole-document granularity and embedding quality degrades for long resumes.
- **Recommendation:** The dead `kyc_chroma_service` already uses a sane 800/150 split — adopt that.

### 19. Retrieval depends on a hard-coded tenant filter — **Medium**

- **Evidence:** `handle_search_documents` builds `where = {"userId": user_id.lower()}` from the
  hard-coded value in issue 1.
- **Impact:** The metadata pre-filter is effectively a constant; the only real discrimination comes
  from the vector distance and the fuzzy name score.

### 20. `top_k=50` with no score threshold — **Low**

- **Evidence:** `vector_db.search(query_vector=query_vec, top_k=50, where=where)`.
- **Impact:** Fifty candidates are always fetched and re-ranked regardless of similarity; there is no
  cut-off, so weak matches still surface.

### 21. Extraction failures degrade silently — **Medium**

- **Evidence:** `extract_details` catches every exception and returns a stub dict with
  `document_type: "other"` and empty fields, embedding the raw model output under `extra.raw_output`.
- **Impact:** A failed parse is indistinguishable from a genuinely unclassifiable document, and the
  record is still written.

---

## Setup & operations

### 22. `requirements.txt` is UTF-16 encoded — **High**

- **Evidence:** `file` reports *"Unicode text, UTF-16, little-endian, with CRLF"*.
- **Impact:** `pip install -r requirements.txt` fails — **including inside the Docker build**, which
  runs exactly that command at [`dockerfile:5`](backend/dockerfile). The image cannot build as written.
- **Recommendation:** Re-save as UTF-8 without BOM.

### 23. `backend/readme` omits the install and run commands — **Medium**

- **Evidence:** [`backend/readme`](backend/readme) covers only venv creation, activation, pip upgrade
  and the torch CPU install. There is no `pip install -r requirements.txt` and no `uvicorn` command.
- **Impact:** A new developer cannot start the service from the readme alone; both commands exist only
  in the Dockerfile.

### 24. No database migrations — **Medium**

- **Evidence:** [`app/database/connection.py`](backend/app/database/connection.py) —
  `Base.metadata.create_all()`. No Alembic directory or configuration.
- **Impact:** `create_all` creates missing tables but never alters existing ones. Any column added to
  one of the 16 models after its table exists is silently absent.

### 25. No tests and no CI — **Medium**

- **Evidence:** No `test_*.py`, `*.test.ts(x)`, `*.spec.ts(x)`, `conftest.py`, `pytest.ini`,
  `jest.config` or `.github/`. `package.json` has no `test` script. `backend/test.db` is 0 bytes.

### 26. Frontend scaffolding was never customised — **Low**

- **Evidence:** [`frontend/README.md`](frontend/README.md) is the unmodified create-next-app README;
  [`app/layout.tsx`](frontend/app/layout.tsx) still declares
  `title: "Create Next App", description: "Generated by create next app"`.
- **Impact:** Browser tab title and any SEO metadata are wrong.

---

## Verified as sound

These were checked and found correct — worth preserving:

- **Session cookies** are set `httpOnly: true, secure: true, sameSite: "lax"` with a 7-day `maxAge`,
  so the token is not reachable from client JavaScript.
- **Passwords** use `passlib` `CryptContext(schemes=["pbkdf2_sha256"])` with `hash`/`verify` — no
  plaintext or reversible storage.
- **Nine input validators** in `auth_service.py` cover username, mobile, password, email, company,
  country, state, city and pincode.
- **Google OAuth** is fully implemented and correctly terminates at the real `user/login-email`
  endpoint.
- **SQLAlchemy ORM** is used throughout the live paths — no raw string-interpolated SQL.
- **No CORS middleware** is correct for this same-origin BFF topology.
- The **merge-conflict artifacts** previously present in `frontend/app/(auth)/upload-excel/` have been
  removed; `page.tsx` was already a clean resolution retaining every handler.
