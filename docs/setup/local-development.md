# Local Development

## Startup order

```
MySQL / MariaDB (3306)
      ↓
Backend  (8000)   — ChromaDB starts embedded, in-process
      ↓
Frontend (3000)
```

No Redis, no Celery, no broker, no worker.

| Component | Technology | Port | Command | Depends on |
| --------- | ---------- | ---: | ------- | ---------- |
| Database | MySQL / MariaDB | 3306 | external service | — |
| Backend | FastAPI / uvicorn | 8000 | `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` | MySQL, `GOOGLE_API_KEY`, `TOKEN_SECRET` |
| ChromaDB | embedded | — | starts with the backend | Backend |
| Frontend | Next.js | **3000** | `npm run dev` | Backend |

## Two terminals

```bash
# Terminal 1
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
# Terminal 2
cd frontend
npm run dev
```

Open <http://localhost:3000>.

## Health and verification

### Backend

| Check | How | Expected |
| ----- | --- | -------- |
| Process up | `curl http://localhost:8000/` | `{"message":"FastAPI MVC Running"}` |
| Vector store loaded | startup console | `🔥 Global Vector DB Loaded — Count = <n>` |
| Tables created | startup console | `✅ All tables created successfully!` |
| Token accepted | `curl -H "PK-apiToken: <token>" -H "Content-Type: application/json" -d '{"limit":10,"offset":0}' http://localhost:8000/master/feature/list` | `Code: 0` |
| Token rejected | same call without the header | `Code: 5001` |
| Swagger | <http://localhost:8000/docs> | Four tag groups |

> `GET /` does **not** touch the database, so it returns 200 even when MySQL is down. There is no
> readiness endpoint — the database is first exercised on a real query.

### Frontend

| Check | Expected |
| ----- | -------- |
| <http://localhost:3000> | redirects to `/home` |
| `/login` → submit | sets a `session_token` httpOnly cookie |
| **Employee → Employee List** | loads — this is the working module |
| Network tab | calls go to `:3000/api/...`, never `:8000` |
| Request headers | no `PK-apiToken` or `PK-sessionToken` visible client-side |

## First end-to-end run

From an empty database:

1. **Sign up** at `/sign-up`, then **log in** at `/login`.
2. **Employee → Add Employee** — create one with an `emp_name`.
3. **Upload documents** — ⚠️ **this cannot be done through the UI.** The handler is misrouted. Use the
   API directly:

   ```bash
   curl -X POST "http://localhost:8000/KYC/upload?employee_id=<emp_id>" \
        -H "PK-apiToken: <token>" \
        -F "files=@/path/to/pan.pdf"
   ```
4. **Employee → Employee List → details** — the extracted fields should appear.
5. **Search** (`/chainlit/search`) — try "show me <name>'s PAN card".

If step 5 returns nothing, check the backend console: `handle_search_documents` prints the metadata
filter (`where =======================>`) and the vector store prints its total count.

## What works and what does not

Expect most of the sidebar to fail — only 12 of 29 handlers reach a live endpoint.

| Menu | Status |
| ---- | ------ |
| **Employee** | ✅ works, except document upload |
| **Search** (`/chainlit/search`) | ✅ works |
| **Setting → Profile Update / Generate Auth** | ✅ works |
| Dashboard, Analytics | ✅ render (static, no API) |
| **Policies** | ❌ routers commented out |
| **Real Estate** | ❌ no backend |
| **KYC** menu | ❌ no `documents/*` backend |

See [../api/frontend-contract-map.md](../api/frontend-contract-map.md).

## Working on the backend

`--reload` re-runs three module-level side effects on **every** save:

- `utils/crypto.py` derives the Fernet key from `TOKEN_SECRET`
- `utils/kyc_document_parser.py` constructs the Gemini chat and embeddings clients
- `vector/vector_db.py` opens the ChromaDB client and counts the collection

Reloads are therefore slower than a plain FastAPI app, but **non-destructive** — the Chroma collection
uses `get_or_create_collection`, so indexed documents survive.

### Where to look when something breaks

| Source | Contents |
| ------ | -------- |
| **Backend console** | `print()` diagnostics — `➡️ Total stored vectors`, `where =====>`, Gemini parse errors |
| `backend/logs/` | Request and error logs via `utils/logger.py` |
| Browser Network tab | Which `/api/*` handler was called and what it returned |

Most KYC search diagnostics are console-only.

## Working on the frontend

- Changes to `.env.local` require a **full restart** — Next.js reads env vars at boot.
- Route handlers under `app/api/` are server code; edits apply on the next request.
- The dev port is **3000**.

## Port conflicts

| Symptom | Fix |
| ------- | --- |
| Address in use on 8000 | `uvicorn app.main:app --reload --port 8001`, then update `NEXT_PUBLIC_API_URL` |
| Port 3000 taken | `npm run dev -- -p 3001`, then update `REDIRECT_URI` and the Google Console entry |

## Resetting local state

```sql
TRUNCATE tbl_pan; TRUNCATE tbl_aadhaar; TRUNCATE tbl_resume;
TRUNCATE tbl_address_proof; TRUNCATE tbl_qualification;
TRUNCATE tbl_document_vectors; TRUNCATE tbl_documents; TRUNCATE tbl_employees;
```

```bash
rm -rf backend/storage/*  backend/vector_db
```

Do both together — truncating the database while leaving `vector_db/` in place leaves orphaned
embeddings that still match searches, and there is **no re-index command** to rebuild from MySQL.

## Things that will surprise you

| Behaviour | Why |
| --------- | --- |
| Errors arrive with HTTP 200 | By design — check `Code` |
| Document upload fails from the UI | Handler targets `document/upload?project_id=` instead of `KYC/upload` |
| Password change, OTP and logout all 404 | Handlers omit the `user/` prefix |
| Logout appears to work but the session stays valid | The request is never sent |
| All documents appear under one user | `userId` is hard-coded to `U-98WZ41BUTTOM` |
| Uploaded PAN/Aadhaar are downloadable without a token | `/storage` is a public static mount |
| Adding a model column has no effect | No migrations — `create_all` only creates missing tables |
| `search-excel` shows the backend in an iframe | Stub page pointing at `http://localhost:8000` |
