# Prerequisites

## Runtimes

| Requirement | Version | Source |
| ----------- | ------- | ------ |
| Python | **3.11** | `backend/dockerfile` — `FROM python:3.11-slim` |
| MySQL / MariaDB | 5.7+ / 10.x | `mysql+pymysql` driver in `connection.py` |
| Node.js | — | **Not verified from the current implementation** — no `engines` field, no `.nvmrc`, and `frontend/README.md` is unmodified scaffolding |
| npm | — | `package-lock.json` present; no yarn/pnpm/bun lockfile |

`backend/readme` does not state a Python version; 3.11 comes from the Dockerfile.

## Services

| Service | Required | Notes |
| ------- | -------- | ----- |
| MySQL / MariaDB | **Yes** | Tables auto-created at startup |
| ChromaDB | **No separate server** | Runs embedded in-process against `./vector_db` |
| Redis / Celery / any broker | No | **No background processing exists** |

## Credentials

| Credential | Required | Used for |
| ---------- | -------- | -------- |
| **`GOOGLE_API_KEY`** | **Yes** | Gemini — OCR of images and PDFs, document classification, field extraction, and `text-embedding-004` embeddings |
| MySQL username/password | Yes | Database connection |
| Google OAuth `CLIENT_ID` / `CLIENT_SECRET` / `REDIRECT_URI` | Only for "Sign in with Google" | Frontend OAuth flow |

`GOOGLE_API_KEY` is consumed at **import time** by `kyc_document_parser.py`, so it must be present
before the backend starts — even if you never upload a document.

Obtain a Gemini key from [Google AI Studio](https://aistudio.google.com/). For OAuth, register a
client in the Google Cloud Console with a redirect URI matching `REDIRECT_URI`.

## Model downloads

Unlike some sibling projects, **no local ML weights are downloaded**. OCR and embeddings are entirely
Google-hosted, so first start is fast and the container stays small.

`requirements.txt` nevertheless pins `torch==2.9.1`, `torchvision==0.24.1` and `torchaudio==2.9.1+cpu`,
and `backend/readme` instructs installing them explicitly. Their role in the live code path is
**not verified from the current implementation** — most likely a transitive requirement of the
LangChain stack.

## Disk

| Path | Grows with |
| ---- | ---------- |
| `backend/storage/{userId}/{employee_id}/` | Every uploaded document |
| `backend/vector_db/` | The ChromaDB collection |
| `backend/app/uploaded_pdfs/` | Policy-module PDFs and JSON (module disabled) |
| `backend/app/chroma_store/` | Policy-module vectors (module disabled) |
| `backend/logs/` | Request and error logs |

Nothing prunes any of these.

## Ports

| Port | Component | Configurable |
| ---: | --------- | ------------ |
| 3306 | MySQL / MariaDB | `DB_PORT` |
| 8000 | FastAPI backend | uvicorn `--port`; Dockerfile `EXPOSE 8000` |
| **3000** | Next.js frontend | `next dev` default — no `-p` flag in `package.json` |

> `API_PORT` exists in `backend/.env` but **no code reads it**. The port comes solely from the uvicorn
> command line or the Dockerfile.

## Platform notes

Nothing in the backend hard-codes POSIX paths — storage paths are built from `os.getcwd()` and
`Path`, so the code is portable. The `/storage` static mount uses a **relative** directory, so the
backend must be launched from `backend/` on every platform.

`backend/readme` documents only the Windows activation command (`.\venv\Scripts\activate`); the
POSIX equivalent is inferred.

## Next steps

1. [database-setup.md](database-setup.md)
2. [backend-setup.md](backend-setup.md)
3. [frontend-setup.md](frontend-setup.md)
4. [local-development.md](local-development.md)
5. [docker.md](docker.md) — containerised alternative
