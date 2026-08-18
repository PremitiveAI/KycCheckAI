# Troubleshooting

Symptom → cause → fix. Everything here is supported by the repository; nothing is invented.

---

## Backend will not start

### `pip install -r requirements.txt` fails to parse the file

`requirements.txt` is **UTF-16 little-endian with CRLF**. Convert it:

```powershell
Get-Content requirements.txt | Set-Content -Encoding utf8 requirements.txt
```

```bash
iconv -f UTF-16 -t UTF-8 requirements.txt > tmp && mv tmp requirements.txt
```

This also breaks `docker build`, which runs the same command. [AUDIT.md](../../AUDIT.md) issue 22.

### `AttributeError: 'NoneType' object has no attribute 'strip'` at import

`GOOGLE_API_KEY` is missing from `backend/.env`. `kyc_document_parser.py:25` runs
`env("GOOGLE_API_KEY").strip()` at **import time**, so the backend cannot start — even if you never
upload a document.

### `AttributeError` from `_generate_fernet_key`

`TOKEN_SECRET` is missing. `crypto.py:19-21` derives the Fernet key at import.

> Both variables **are** present in the committed `.env`. Note it uses `KEY = value` with spaces —
> `python-dotenv` handles that, but a shell script grepping `^KEY=` will not find them.

### `RuntimeError: Directory 'storage' does not exist`

`app.mount("/storage", StaticFiles(directory="storage"))` uses a **relative** path. Start uvicorn from
`backend/`.

### Database connection errors

Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, and that MySQL is running:

```bash
mysql -h localhost -P 3306 -u root -p -e "SELECT 1;"
```

> The password is **not URL-encoded** in the connection string. A password containing `@`, `:`, `/`
> or `#` will corrupt it. Use an alphanumeric password.

### Docker container cannot reach the database

`DB_HOST=localhost` inside a container refers to the container. Use `host.docker.internal` on Docker
Desktop, or a container name on a shared network. See [../setup/docker.md](../setup/docker.md).

---

## Nothing works — every request fails

### `Code 5002 — Invalid API Token`

`API_TOKEN` differs between `backend/.env` and `frontend/.env.local`. They must match exactly.

Because this is returned with **HTTP 200**, frontend handlers that only check `res.ok` treat it as
success and render an empty page. Verify directly:

```bash
curl -H "PK-apiToken: <token>" -H "Content-Type: application/json" \
     -d '{"limit":10,"offset":0}' http://localhost:8000/master/feature/list
```

### `Code 5001 — API Token required`

`API_TOKEN` is unset in `frontend/.env.local`, so `utils/api.ts` falls back to `""`. Restart the
Next.js dev server after editing `.env.local` — env vars are read at boot.

---

## Features that do not work — by design of the current code

**Only 12 of 29 frontend handlers reach a live endpoint.** Before debugging any of the below, check
[../api/frontend-contract-map.md](../api/frontend-contract-map.md).

### Document upload fails from the Employee page

`/api/employee/employee-upload` targets `document/upload?project_id=…`, which does not exist. The
working endpoint is `POST /KYC/upload`. Workaround until fixed:

```bash
curl -X POST "http://localhost:8000/KYC/upload?employee_id=<emp_id>" \
     -H "PK-apiToken: <token>" -F "files=@/path/to/pan.pdf"
```

[AUDIT.md](../../AUDIT.md) issue 8.

### Password change, OTP generation and OTP validation all 404

Those three handlers omit the `user/` prefix — they call `update-password`, `generate-otp` and
`validate-otp`, while the backend registers `user/update-password`, `user/generate-otp` and
`user/validate-otp`. One-word fix per handler. [AUDIT.md](../../AUDIT.md) issue 6.

### Logout appears to succeed but the session stays valid

`logout/route.ts` builds an axios config and **never executes it**. Cookies are cleared; the
`tbl_users_sessions` row remains `status=1`. [AUDIT.md](../../AUDIT.md) issue 3.

### The "KYC" sidebar menu is entirely empty

Its three pages call a `documents/*` API that does not exist. **The working KYC implementation is under
the "Employee" menu.** See [../roadmap/upcoming-features.md](../roadmap/upcoming-features.md).

### The "Policies" menu is entirely empty

Its routers are commented out of `main.py`. See [../modules/policy.md](../modules/policy.md).

### "Real Estate" upload does nothing

`/api/upload-excel` targets `upload_excel/`, which has no backend.

### `search-excel` shows the API in an iframe

That page is a 17-line stub embedding `http://localhost:8000` — the FastAPI port, not a search UI.
Identical to `employee/search-employee-doc`.

### `excel-list` shows nothing

It calls `/api/query/RES-1001` and `/api/query/RES-1002` — handlers that do not exist, with hard-coded
IDs.

---

## KYC search returns nothing

Work through these in order:

1. **Is anything indexed?** The startup console prints
   `🔥 Global Vector DB Loaded — Count = <n>`. If `n` is 0, no documents have been uploaded
   successfully.
2. **Did the upload actually classify the document?** If `extract_details` failed to parse the model
   output, the record is saved with `document_type: "other"` and mostly empty fields — it will not
   match a typed query. Check the backend console for the raw Gemini response.
3. **Is the metadata filter too narrow?** `handle_search_documents` prints
   `where =======================> {...}`. Filters are ANDed — a query naming a document type the
   employee does not have returns nothing.
4. **Is the name spelled close enough?** The re-rank uses `fuzz.partial_ratio`, but `full_name` is also
   used as an **exact** metadata filter when a name is parsed out of the query.

Detail: [../modules/document-rag.md](../modules/document-rag.md).

## All documents appear under one user

Working as implemented. `userId` is hard-coded to `"U-98WZ41BUTTOM"` at `kyc_routes.py:59` for upload
and again at line 65 for search, where it overwrites the middleware value.
[AUDIT.md](../../AUDIT.md) issue 1.

## Uploaded PAN/Aadhaar are downloadable without logging in

Working as implemented, and a real exposure. `/storage` is a `StaticFiles` mount. Block it at the proxy
until fixed. [AUDIT.md](../../AUDIT.md) issue 2.

---

## Database

### A column I added to a model does not exist

There are no migrations. `create_all()` creates missing tables but **never alters existing ones**. Apply
the DDL by hand, or drop the table and let it be recreated.

### Data too long for column `skills`

`tbl_resume.skills` is `String(225)`. Widen it to `TEXT`.

### Address-proof uploads fail to save

`tbl_address_proof.address` is `String(225)` and **NOT NULL** — a document whose address fails to
extract cannot be inserted.

---

## Frontend

### The dev server is not on the port I expected

`npm run dev` is plain `next dev` — **port 3000**.

### Google sign-in fails

The handlers read `process.env.CLIENT_ID`, `CLIENT_SECRET` and `REDIRECT_URI` — **not** the
`GOOGLE_CLIENT_ID` / `GOOGLE_REDIRECT_URI` names exported from `utils/api.ts`. `REDIRECT_URI` must
match the value registered in the Google Cloud Console exactly.

### Pages load for logged-out users

There is no route guard — no `middleware.ts`, one layout. `(auth)` is a naming convention. Pages render,
then fail to populate. [AUDIT.md](../../AUDIT.md) issue 4.

### The browser tab says "Create Next App"

`app/layout.tsx` metadata is unmodified scaffolding.

---

## Diagnostics

| Source | Contents |
| ------ | -------- |
| **Backend console** | `➡️ Total stored vectors`, `🔥 Global Vector DB Loaded`, `where =====>`, Gemini parse errors and raw responses |
| `backend/logs/` | Request and error logs via `utils/logger.py` |
| Browser Network tab | Which `/api/*` handler ran and what it returned |
| Swagger `/docs` | Request schemas (no response models declared) |

Most KYC search diagnostics are **console-only** — they do not reach the log files.
