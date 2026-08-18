# Backend Setup

Every command below is traced to `backend/readme`, `backend/dockerfile` or the source, and labelled with
its origin.

> **`backend/readme` is incomplete.** It covers four steps — venv, activate, pip upgrade, torch — and
> stops. It contains **no dependency install and no run command**. Both come from `backend/dockerfile`.
> [AUDIT.md](../../AUDIT.md) issue 23.

## Step 1 — Python 3.11

```bash
python --version
```

The Dockerfile pins `python:3.11-slim`. `backend/readme` does not state a version.

## Step 2 — Virtual environment

```bash
cd backend
python -m venv venv            # readme step 1
.\venv\Scripts\activate        # readme step 2 (Windows)
source venv/bin/activate       # macOS / Linux — inferred, not in the readme
```

## Step 3 — Upgrade pip

```bash
python -m pip install --upgrade pip        # readme step 3
```

The Dockerfile pins a specific version: `pip install --upgrade pip==25.3`.

## Step 4 — Install PyTorch (CPU)

```bash
pip install torch==2.9.1 torchaudio==2.9.1 --index-url https://download.pytorch.org/whl/cpu
```

`backend/readme` step 4. `requirements.txt` also pins `torch==2.9.1`, `torchaudio==2.9.1+cpu` and
`torchvision==0.24.1`.

> Torch's role in the live code path is **not verified from the current implementation** — the KYC
> pipeline uses Google-hosted models for both OCR and embeddings. It is likely a transitive requirement.

## Step 5 — Install dependencies

The command from the Dockerfile:

```bash
pip install -r requirements.txt
```

### ⚠️ This fails as written

`requirements.txt` is **UTF-16 little-endian with CRLF**; pip cannot parse it. Convert first:

```powershell
# Windows PowerShell, from backend/
Get-Content requirements.txt | Set-Content -Encoding utf8 requirements.utf8.txt
pip install -r requirements.utf8.txt
```

```bash
# macOS / Linux, from backend/
iconv -f UTF-16 -t UTF-8 requirements.txt > requirements.utf8.txt
pip install -r requirements.utf8.txt
```

**This also breaks the Docker build**, which runs the same command at `dockerfile:5`.
[AUDIT.md](../../AUDIT.md) issue 22.

### What the file declares — 157 pinned packages

| Group | Key packages |
| ----- | ------------ |
| API | `fastapi==0.127.0`, `uvicorn==0.40.0` |
| Database | `SQLAlchemy==2.0.45`, `PyMySQL==1.1.2` |
| Vector | `chromadb==1.3.7` |
| LangChain | `langchain==1.2.0`, `langchain-chroma==1.1.0`, `langchain-core==1.2.4`, `langchain-community==0.4.1`, `langchain-classic==1.0.0`, `langchain-text-splitters==1.1.0`, `langchain-google-genai==4.1.2` |
| Google | `google-genai==1.56.0`, `google-auth==2.45.0` |
| Documents | `PyMuPDF==1.26.7`, `python-docx==1.2.0`, `pillow==12.0.0` |
| Matching | `RapidFuzz==3.14.3` |
| ML | `torch==2.9.1`, `torchvision==0.24.1`, `torchaudio==2.9.1+cpu` |

Fully pinned — the most disciplined dependency file of the three sibling projects.

## Step 6 — Configure environment

Create `backend/.env`. See [environment-variables.md](environment-variables.md) for the full
inventory; the minimum is `DB_*`, `API_TOKEN`, `TOKEN_SECRET`, `GOOGLE_API_KEY`, `CHROMA_DIR`.

## Step 7 — Database

```bash
mysql -u root -p -e "CREATE DATABASE kyc_check;"
```

Tables are created at startup. See [database-setup.md](database-setup.md).

## Step 8 — Migrations

**None required, and none available.** No Alembic configuration exists. `create_all()` creates missing
tables but never alters existing ones. [AUDIT.md](../../AUDIT.md) issue 24.

## Step 9 — Seed data

**Not verified from the current implementation.** No seed scripts or fixtures. Masters (feature,
category) and employees are created through the API.

## Step 10 — Run

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000        # dockerfile CMD
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000  # development
```

Run from `backend/` — `app.mount("/storage", StaticFiles(directory="storage"))` uses a relative path.

Expected startup output:

```
➡️ Total stored vectors = <n>
🔥 Global Vector DB Loaded — Count = <n>
✅ All tables created successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

The first two lines come from the ChromaDB singleton in `app/vector/vector_db.py`, which loads at
import.

## Step 11 — Docker (alternative)

```bash
docker build -t kyc-check-backend .
docker run -p 8000:8000 --env-file .env kyc-check-backend
```

Subject to the UTF-16 blocker in step 5. See [docker.md](docker.md).

## Step 12 — Workers

**None.** No Celery, Redis, broker or scheduler exists anywhere in the codebase or requirements.

## Step 13 — Tests, lint, format, type-check

**Not verified from the current implementation.** No pytest configuration, no `ruff`/`flake8`/`black`/
`mypy` config, and none of those tools in `requirements.txt`. See
[../testing/testing-status.md](../testing/testing-status.md).

## Step 14 — Verify

```bash
curl http://localhost:8000/
# {"message":"FastAPI MVC Running"}
```

```bash
curl -H "PK-apiToken: <token>" -H "Content-Type: application/json" \
     -d '{"search":"","limit":10,"offset":0}' \
     http://localhost:8000/master/feature/list
```

Swagger UI: <http://localhost:8000/docs>

## Command reference

| Purpose | Command | Verified from | Confidence |
| ------- | ------- | ------------- | ---------- |
| Create venv | `python -m venv venv` | `backend/readme` | High |
| Activate (Windows) | `.\venv\Scripts\activate` | `backend/readme` | High |
| Upgrade pip | `python -m pip install --upgrade pip` | `backend/readme` | High |
| Install torch | `pip install torch==2.9.1 torchaudio==2.9.1 --index-url https://download.pytorch.org/whl/cpu` | `backend/readme` | High |
| Install deps | `pip install -r requirements.txt` | `dockerfile:5` | High — **needs UTF-8 conversion** |
| Run server | `uvicorn app.main:app --host 0.0.0.0 --port 8000` | `dockerfile` CMD | High |
| Docker build/run | `docker build . && docker run -p 8000:8000` | `dockerfile` | High |
| Activate (macOS/Linux) | `source venv/bin/activate` | — inferred | Medium |
| Migrations / seed / tests / lint / format / typecheck | — | **Command not verified from the current implementation** | — |
