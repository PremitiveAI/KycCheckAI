# Database Setup

**MySQL / MariaDB.** ChromaDB runs embedded and needs no setup of its own.

## Step 1 — Create the database

```bash
mysql -u root -p -e "CREATE DATABASE kyc_check CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

The name is arbitrary — it only has to match `DB_NAME`. **Do not create any tables**; the application
does that.

`utf8mb4` matters here: extracted names and addresses are transliterated to English by the extraction
prompt, but source OCR text and `extra_json` payloads may contain non-Latin characters.

## Step 2 — Configure the connection

```ini
DB_HOST = localhost
DB_PORT = 3306
DB_NAME = kyc_check
DB_USERNAME = root
DB_PASSWORD = <REDACTED>
```

[`connection.py`](../../backend/app/database/connection.py) builds one of two URLs:

```python
# with a password
f"mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
# without
f"mysql+pymysql://{DB_USERNAME}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
```

> The password is **not** URL-encoded. A password containing `@`, `:`, `/` or `#` will corrupt the
> connection string. Use an alphanumeric password, or add `urllib.parse.quote_plus`.

`create_engine(..., pool_pre_ping=True)` — stale connections are detected and recycled.

> `DB_USER` (singular) is read by `services/user_db.py`, an unregistered module. The project defines
> `DB_USERNAME`. Do not add `DB_USER` expecting it to matter.

## Step 3 — Let the application create the tables

```python
@app.on_event("startup")
def startup_event():
    create_all_tables()      # Base.metadata.create_all(bind=engine)
```

Expected on first start:

```
✅ All tables created successfully!
```

## Step 4 — Verify

```sql
USE kyc_check;
SHOW TABLES;
```

**15 tables** should exist:

| Group | Tables |
| ----- | ------ |
| Employees & documents | `tbl_employees`, `tbl_pan`, `tbl_aadhaar`, `tbl_resume`, `tbl_address_proof`, `tbl_qualification` |
| Document/RAG | `tbl_documents`, `tbl_document_vectors` |
| Users & admin | `tbl_users`, `tbl_admin` |
| Sessions | `tbl_users_sessions`, `tbl_admin_sessions`, `tbl_emp_session` |
| OTP | `tbl_otps` |
| Masters | `tbl_category_master`, `tbl_feature_type_master` |

That is 16 names — `session_model.py` is entirely commented out and produces no table, so the count of
*model files* (16) and *tables* (15, plus masters = 16 listed) differs. Column-level detail:
[../database/schema.md](../database/schema.md).

## Step 5 — Seed data

**Not verified from the current implementation.** No seed scripts, fixtures or bootstrap SQL exist.

To exercise the product you need, in order:

1. **A user** — `POST /user/signup`, then `POST /user/login` for a session token.
2. **Masters** (optional) — `POST /master/feature/save`, `POST /master/category/save`. Only the
   `generate-auth` page reads these.
3. **An employee** — `POST /KYC/create` with `emp_name`.
4. **Documents** — `POST /KYC/upload` with `files` and `employee_id`. This is what populates the five
   typed tables and the vector index.

Note step 4 cannot be done through the UI — see [../api/frontend-contract-map.md](../api/frontend-contract-map.md).

## Migrations

**There is no migration tooling.** No Alembic directory, `alembic.ini` or `versions/`.

> `create_all()` creates **tables that do not exist**. It never alters one that does. Adding, renaming
> or retyping a column on a model whose table is already present leaves the database unchanged, and
> queries fail at runtime.

Apply schema changes by hand until Alembic is introduced ([AUDIT.md](../../AUDIT.md) issue 24):

```sql
ALTER TABLE tbl_resume MODIFY skills TEXT;
```

Two changes worth making while you are there:

- `tbl_resume.skills` is `String(225)` — a comma-joined skill list truncates quickly.
- `tbl_address_proof.address` is `String(225)` and **NOT NULL**, so an address-proof document whose
  address fails to extract cannot be inserted at all.

## ChromaDB

No setup required. `chromadb.PersistentClient(path="./vector_db")` creates the directory on demand and
uses `get_or_create_collection` — **the collection survives restarts**. On startup you will see:

```
➡️ Total stored vectors = <n>
🔥 Global Vector DB Loaded — Count = <n>
```

## Backups

Three locations, and a database-only backup is incomplete:

| Location | Contents | Reproducible? |
| -------- | -------- | ------------- |
| MySQL | Employees, extracted fields, users, sessions, masters | — |
| `backend/vector_db/` | Embeddings | Yes, by re-uploading — but there is **no re-index command** |
| `backend/storage/` | **Original uploaded documents** | **No** |

Back up MySQL and `backend/storage/` together at minimum.

## Slow queries

SQLAlchemy `event` listeners are configured in `connection.py` for slow-query logging. The threshold
and destination were **not verified line-by-line**; check `logs/` for output.
