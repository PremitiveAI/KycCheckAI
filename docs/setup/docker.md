# Docker

A Dockerfile is provided for the **backend only**. There is no frontend image and no compose file.

## The Dockerfile

[`backend/dockerfile`](../../backend/dockerfile) — note the lowercase filename:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip==25.3
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

This file is the **authoritative source** for two commands `backend/readme` omits: the dependency
install and the run command.

## ⚠️ The build fails as written

`RUN pip install -r requirements.txt` at line 5 cannot succeed — `requirements.txt` is **UTF-16
little-endian with CRLF**, which pip cannot parse. [AUDIT.md](../../AUDIT.md) issue 22.

Fix the file once, permanently:

```powershell
Get-Content requirements.txt | Set-Content -Encoding utf8 requirements.txt
```

```bash
iconv -f UTF-16 -t UTF-8 requirements.txt > tmp && mv tmp requirements.txt
```

After that the Dockerfile builds unchanged.

## Building and running

```bash
cd backend
docker build -t kyc-check-backend .
docker run -p 8000:8000 --env-file .env kyc-check-backend
```

`--env-file .env` is required — the image contains no configuration. See
[environment-variables.md](environment-variables.md).

## What the image does not include

| Concern | Status |
| ------- | ------ |
| **Database** | Not included. MySQL must be reachable from the container — `DB_HOST=localhost` will point at the *container*, not the host. Use `host.docker.internal` on Docker Desktop, or a container name on a shared network |
| **Frontend** | No image, no build stage |
| **Compose** | No `docker-compose.yml` — the backend, database and frontend must be wired by hand |
| **Persistence** | No volumes declared. `storage/`, `vector_db/` and `logs/` live inside the container and are **lost when it is removed** |
| **`.dockerignore`** | Absent — `COPY . .` copies everything present, including `venv/`, `logs/`, `storage/` and `.env` if they exist locally |
| **Non-root user** | Not configured; the process runs as root |
| **Health check** | None declared, though `GET /` would serve |

## Persistence

Because no volumes are declared, a `docker run` without mounts loses every uploaded document and the
entire vector index on container removal. Mount all three paths:

```bash
docker run -p 8000:8000 --env-file .env \
  -v "$(pwd)/storage:/app/storage" \
  -v "$(pwd)/vector_db:/app/vector_db" \
  -v "$(pwd)/logs:/app/logs" \
  kyc-check-backend
```

The `/storage` static mount and the ChromaDB `PersistentClient(path="./vector_db")` both use paths
relative to `WORKDIR /app`, so these mount points are correct.

## `.dockerignore`

Worth adding before building, since `COPY . .` currently copies whatever is in the directory:

```
venv/
__pycache__/
*.pyc
.env
logs/
storage/
vector_db/
app/chroma_store/
app/uploaded_pdfs/
test.db
```

Excluding `.env` matters — otherwise credentials are baked into the image layer even though they are
also passed via `--env-file`.

## Database connectivity from the container

`DB_HOST=localhost` inside a container refers to the container itself. Options:

```ini
# Docker Desktop (Windows / macOS)
DB_HOST = host.docker.internal

# shared user-defined network, MySQL running as a container named "mysql"
DB_HOST = mysql
```

```bash
docker network create kyc-net
docker run -d --name mysql --network kyc-net -e MYSQL_ROOT_PASSWORD=… -e MYSQL_DATABASE=kyc_check mysql:8
docker run -p 8000:8000 --network kyc-net --env-file .env kyc-check-backend
```

## A compose file would help

None exists, and the stack has four moving parts (MySQL, backend, frontend, plus volumes). A compose
file would remove most of the manual wiring above. That is a **recommendation, not something present in
the repository.**

## Production considerations

Not addressed by the current Dockerfile: no worker/process manager (single uvicorn process), no
`--workers` flag, no reverse proxy or TLS, no non-root user, no health check, no resource limits, and
no log driver configuration. The image is suitable for development and evaluation as written.
