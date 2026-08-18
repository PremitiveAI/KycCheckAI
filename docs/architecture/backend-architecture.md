# Backend Architecture

FastAPI application in [`backend/app/`](../../backend/app/) — 75 Python files.

## Directory layout

```
backend/app/
├── main.py                FastAPI instance, middleware, routers, /storage mount
├── config/env.py          dotenv loader + env() getter
├── database/connection.py MySQL engine, SessionLocal, Base, get_db, slow-query events
├── docs/swagger_headers.py SwaggerAPIHeaders / SwaggerSessionHeaders dependencies
├── middlewares/    (4)    auth, exception, jwt_error, request_logger
├── routes/         (9)    4 registered · 5 not
├── controllers/    (5)    admin, auth, employee, master, user
├── services/      (14)    auth, admin, employee, master, session, list,
│                          kyc_document, gemini, rag, translator, pdf_reader,
│                          user_db, vector_db, list_service
├── models/        (16)    15 tables + 1 fully commented out
├── schemas/       (13)    Pydantic request models
├── repositories/   (4)    auth, document, otp, user
├── vector/         (2)    vector_db (live), kyc_chroma_service (dead)
└── utils/          (4)    crypto, kyc_document_parser, logger, response
```

## Entry point

[`app/main.py`](../../backend/app/main.py):

```python
app = FastAPI()

app.add_middleware(request_logger.RequestLoggingMiddleware)
app.add_middleware(auth_middleware.UserApiVerifyMiddleware)
exception_handler.register_exception_handlers(app)
jwt_error_handler.register_jwt_error_handler(app)

app.include_router(public_router)          # /user
app.include_router(protected_router)       # /user
app.include_router(master_router)          # /master
app.include_router(masterprotected_router) # /master
app.include_router(admin_router)           # /admin_user
app.include_router(kyc_public_router)      # /KYC
app.include_router(kyc_protected_router)   # /KYC — no routes attached

@app.on_event("startup")
def startup_event(): create_all_tables()

app.mount("/storage", StaticFiles(directory="storage"), name="storage")
```

`FastAPI()` is constructed with **no title, version or description**, so `/docs` is untitled and carries
no response models.

### Disabled at the top of the file

```python
# from app.routes.upload import router as upload_router
# from app.routes.query import router as query_router
# from app.routes.library import router as library_router
...
# app.include_router(query_router)
# app.include_router(upload_router)
```

These are the Policy module. Note `library_router` is not even in the commented include list. See
[../modules/policy.md](../modules/policy.md).

`otp_routes.py` and `user_routes.py` are never imported at all.

## Router inventory

| Router | Prefix | Endpoints | Dependencies |
| ------ | ------ | --------: | ------------ |
| `public_router` (login) | `/user` | 6 | `SwaggerAPIHeaders` |
| `protected_router` (login) | `/user` | 4 | `SwaggerSessionHeaders` + `verify_session` |
| `master_router` | `/master` | 4 | `SwaggerAPIHeaders` |
| `masterprotected_router` | `/master` | 4 | `SwaggerSessionHeaders` + `verify_session` |
| `admin_router` | `/admin_user` | 2 | `SwaggerAPIHeaders` |
| `kyc_public_router` | `/KYC` | 7 | `SwaggerAPIHeaders` |
| `kyc_protected_router` | `/KYC` | **0** | declared, registered, empty |

**27 endpoints + `GET /`.**

## Layering

`route → controller → service → model`. Applied unevenly:

| Module | Route | Controller | Service | Repository |
| ------ | :---: | :--------: | :-----: | :--------: |
| User / auth | ✅ | ✅ `AuthController` | ✅ `auth_service` | `auth_repository` exists |
| Admin | ✅ | ✅ `AdminController` | ✅ `admin_service` | ✗ |
| Master | ✅ | ✅ `MasterController` | ✅ `master_service` | ✗ |
| KYC — employee | ✅ | ✅ `EmployeeController` | ✅ `employee_service` | ✗ |
| KYC — documents | ✅ | ✗ — route calls the service directly | ✅ `kyc_document_service` | `document_repository` |

`/KYC/upload`, `/KYC/search` and `/KYC/delete` bypass the controller and call services straight from the
route.

`app/repositories/` holds four modules; `document_repository` is used by `kyc_document_service`. The
other three are **potentially unreferenced — requires confirmation**.

## Middleware

Registered logging → auth → exception handling. Starlette executes **last-added first**, so exception
handling wraps auth wraps logging.

### `UserApiVerifyMiddleware`

```python
ALLOWED_PATHS = ["/", "/docs", "/redoc", "/openapi.json"]

api_token = request.headers.get("PK-apiToken")
if not api_token:                  return error_response("API Token required", code=5001)
if api_token != env('API_TOKEN'):  return error_response("Invalid API Token", code=5002)

request.state.country      = request.headers.get("PK-country",  env("DEFAULT_COUNTRY", "IN"))
request.state.timezone     = request.headers.get("PK-timezone", env("DEFAULT_TZ", "Asia/Kolkata"))
request.state.dialing_code = 1 if request.state.country == "CA" else 91
request.state.base_url     = str(request.base_url).rstrip("/")
```

Note there is **no `/storage` exemption** here — but `StaticFiles` mounts are handled by Starlette's
router before the ASGI app's route matching, so the mount is reachable. The practical effect is the
same as an exemption: uploaded documents are downloadable without a token.

### `verify_session`

A dependency, not middleware. Applied to `protected_router` and `masterprotected_router`; backed by
`session_service.get_user_session` and `is_device_blocked`, with `AdminSessions` and `AdminUsers`
imported for the admin variant.

### Others

`GlobalExceptionMiddleware` (422 / 500 → envelope), `jwt_error_handler` (`jose.JWTError` → 401 /
`Code 4010`, never raised in practice), `RequestLoggingMiddleware`.

## Response envelope

[`app/utils/response.py`](../../backend/app/utils/response.py) — `success_response`, `error_response`
and `throw_error_response`, **all returning HTTP 200**:

```json
{ "Success": { "message": "…", "data": {} }, "Code": 0,    "Error": null }
{ "Success": null,                           "Code": 4002, "Error": { "message": "…" } }
```

The only non-200 responses are the 400 from the `RequestValidationError` handler in `main.py` and the
422/500 from the exception middleware. See [../api/error-codes.md](../api/error-codes.md).

## Database layer

[`app/database/connection.py`](../../backend/app/database/connection.py):

- **MySQL/MariaDB** via `mysql+pymysql`, with two URL branches — with and without a password.
- `create_engine(..., pool_pre_ping=True)`.
- `create_all_tables()` at startup — creates missing tables, **never alters existing ones**.
- SQLAlchemy `event` listeners configured for slow-query logging.
- `get_db()` yields a session and closes it in `finally`.

## Import-time side effects

Three modules do real work as they load, which affects startup time and every `--reload` cycle:

| Module | Side effect |
| ------ | ----------- |
| `utils/crypto.py` | Derives the Fernet key from `TOKEN_SECRET` |
| `utils/kyc_document_parser.py` | Constructs `ChatGoogleGenerativeAI` and `GoogleGenerativeAIEmbeddings` |
| `vector/vector_db.py` | Opens the ChromaDB `PersistentClient` and prints the collection count |

## Background processing

**Not found in implementation.** No Celery, Redis, RQ, broker, scheduler, cron or `BackgroundTasks` in
the code or in `requirements.txt`. Document processing is fully synchronous inside the upload request.

## Logging

`app/utils/logger.py` provides named loggers writing to `logs/`. The KYC pipeline and the vector store
additionally use bare `print()` (`➡️ Total stored vectors`, `where =====>`, `🔥 Global Vector DB Loaded`),
so the **console is the primary diagnostic surface** for search behaviour.
