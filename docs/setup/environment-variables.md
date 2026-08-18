# Environment Variables

Established by cross-referencing every `env(...)` call in the backend and every `process.env` reference
in the frontend against the files that declare them.

**`backend/.env` defines 20 variables; the code reads 13.**

> **Note on formatting.** The file uses `KEY = value` with spaces around `=`. `python-dotenv` strips
> that whitespace and loads the values correctly — a naive `grep "^KEY="` will miss most of them.

**No secret values appear in this document.**

---

## Backend — `backend/.env`

### Required — read by the code

| Variable | Purpose | Read by | Safe example |
| -------- | ------- | ------- | ------------ |
| `DB_HOST` | MySQL host | [`connection.py`](../../backend/app/database/connection.py) | `localhost` |
| `DB_PORT` | MySQL port | `connection.py` | `3306` |
| `DB_NAME` | Database name | `connection.py` | `kyc_check` |
| `DB_USERNAME` | Database user | `connection.py` | `root` |
| `DB_PASSWORD` | Database password | `connection.py` | `<REDACTED>` |
| `API_TOKEN` | Compared against `PK-apiToken` on every request | [`auth_middleware.py`](../../backend/app/middlewares/auth_middleware.py) | `<REDACTED>` |
| `TOKEN_SECRET` | SHA-256 seed for the Fernet key used to encrypt session tokens | [`crypto.py:19`](../../backend/app/utils/crypto.py) | `<REDACTED>` |
| `GOOGLE_API_KEY` | Gemini — OCR, classification, extraction, embeddings | `kyc_document_parser.py`, `services/vector_db.py` | `<REDACTED>` |
| `CHROMA_DIR` | Chroma persist directory for `kyc_chroma_service` | `vector/kyc_chroma_service.py` | `./chroma_store` |

`TOKEN_SECRET` and `GOOGLE_API_KEY` are consumed at **import time** — `crypto.py` derives the Fernet key
and `kyc_document_parser.py` constructs the LLM client as their modules load.

### Read with a code default — not present in `.env`

| Variable | Default | Read by |
| -------- | ------- | ------- |
| `GOOGLE_AI_MODEL` | `gemini-2.0-flash` | `kyc_document_parser.py:26` |
| `DEFAULT_COUNTRY` | `IN` | `auth_middleware.py` |
| `DEFAULT_TZ` | `Asia/Kolkata` | `auth_middleware.py` |
| `DB_USER` | `root` | `services/user_db.py` — **unregistered module**; the project defines `DB_USERNAME`, not `DB_USER` |

Adding the first three to `.env` is optional. `DB_USER` is latent — nothing imports `user_db.py`.

### Defined but never read — 11

| Variable | Status |
| -------- | ------ |
| `API_VERSION` | Unused. **Purpose not verified from the current implementation.** |
| `ISPRODUCTION` | Unused — no environment switch exists in the code |
| `API_PORT` | **Unused and misleading.** The port comes only from the uvicorn command line / Dockerfile (`8000`) |
| `TIMEZONE`, `TZ` | Unused — `TZ` is written as `export TZ=…`, which dotenv accepts but nothing reads |
| `DATE_FORMAT`, `DB_DATE_FORMAT`, `DOB_DATE_FORMAT`, `DB_DOB_DATE_FORMAT` | Unused — date formatting is hard-coded |
| `ENCRYPT_SECRET` | Unused. `crypto.py` uses `TOKEN_SECRET` |
| `UPLOAD_DIR` | Unused — upload paths are built from `os.getcwd()` and literals |

These are inherited configuration. Changing them has no effect.

### Minimal working `backend/.env`

```ini
DB_HOST = localhost
DB_PORT = 3306
DB_NAME = kyc_check
DB_USERNAME = root
DB_PASSWORD = <REDACTED>

API_TOKEN = <REDACTED>
TOKEN_SECRET = <REDACTED>
GOOGLE_API_KEY = <REDACTED>
GOOGLE_AI_MODEL = gemini-2.0-flash

CHROMA_DIR = ./chroma_store
```

---

## Frontend — `frontend/.env.local`

No env file is committed (`.gitignore` excludes `.env*`) and no `.env.example` exists.

### Required

| Variable | Purpose | Ships to browser? |
| -------- | ------- | :---------------: |
| `NEXT_PUBLIC_API_URL` | Backend base URL — **should end with `/`** | yes (harmless) |
| `API_TOKEN` | Sent as `PK-apiToken`; must equal the backend value. Server-only | **no** |

**On the trailing slash.** Handlers are inconsistent. Most normalise with
`API_URL.replace(/\/$/, "")` and tolerate either form, but several concatenate directly
(`` `${API_URL}user/login` ``) and require the slash, while `user-list` uses
`` `${API_URL}/employee/list` `` and double-slashes when it is present. Include the slash — it satisfies
the majority.

**On `API_TOKEN`.** No `NEXT_PUBLIC_` prefix, imported only by server-side handlers, so Next.js keeps
it out of the client bundle. Adding the prefix would publish it.

### Required for Google sign-in

| Variable | Read by |
| -------- | ------- |
| `CLIENT_ID` | `app/api/google/route.ts` |
| `REDIRECT_URI` | `app/api/google/route.ts` |
| `CLIENT_SECRET` | `app/api/google/callback/route.ts` |

> `app/utils/api.ts` also exports `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and
> `GOOGLE_REDIRECT_URI` — **different names, and unused**. The OAuth handlers read
> `process.env.CLIENT_ID` / `REDIRECT_URI` directly.

### Declared but never consumed

`SESSION_SECRET` (defaults to `"dev-secret"`), `ISSUER_URL`, and the three `GOOGLE_*` names above —
all exported from `utils/api.ts`, referenced nowhere. `COOKIE_SECRET` is read by
`app/utils/crypto.ts`, whose `encrypt()` is called in `login/route.ts` but whose **result is discarded**.

### Minimal working `frontend/.env.local`

```ini
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/
API_TOKEN=<same value as backend API_TOKEN>

CLIENT_ID=<REDACTED>
CLIENT_SECRET=<REDACTED>
REDIRECT_URI=http://localhost:3000/api/google/callback
```

---

## Cross-application consistency

| Backend | Frontend | Must match |
| ------- | -------- | ---------- |
| `API_TOKEN` | `API_TOKEN` | **Yes** — a mismatch makes every request fail with `Code 5002` |
| uvicorn port (8000) | host:port in `NEXT_PUBLIC_API_URL` | **Yes** |
| — | `REDIRECT_URI` | Must match the redirect URI registered in Google Cloud Console |

A mismatched token is the most common setup failure and easy to misread, because the backend returns it
with **HTTP 200**. See [../troubleshooting/common-issues.md](../troubleshooting/common-issues.md).
