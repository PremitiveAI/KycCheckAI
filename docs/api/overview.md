# API Overview

Conventions applying to every endpoint. **Base URL:** `http://127.0.0.1:8000/` in local development.

> Swagger at `/docs` lists paths but declares no response models — `FastAPI()` is constructed without
> metadata. These documents are the authoritative reference.

## Authentication

Two headers, depending on the router.

| Header | Required on | Failure |
| ------ | ----------- | ------- |
| `PK-apiToken` | **Everything** except `/`, `/docs`, `/redoc`, `/openapi.json` | `5001` missing · `5002` mismatch |
| `PK-sessionToken` | `protected_router` and `masterprotected_router` | Handled by `verify_session` |

Optional and read into `request.state`: `PK-country` (default `IN`), `PK-timezone` (default
`Asia/Kolkata`). `PK-role` and `PK-deviceid` are declared in `SwaggerAPIHeaders` but **`PK-role` is
never read for any decision**.

The Next.js BFF attaches `PK-apiToken` on every call and `PK-sessionToken` from the `session_token`
httpOnly cookie on protected calls.

## Response envelope

```json
{ "Success": { "message": "…", "data": { } }, "Code": 0,    "Error": null }
{ "Success": null,                            "Code": 4002, "Error": { "message": "…" } }
```

### Errors are returned with HTTP 200

`success_response`, `error_response` and `throw_error_response` in
[`app/utils/response.py`](../../backend/app/utils/response.py) all use `status_code=200`.

```js
// ❌ Wrong — rarely taken
if (!res.ok) handleError();
// ✅ Correct
const json = await res.json();
if (json.Code !== 0) handleError(json.Error.message);
```

Several frontend handlers only check `res.ok`, which is why backend errors often surface as empty
screens rather than messages.

### Exceptions

| Status | Source |
| -----: | ------ |
| 400 | `RequestValidationError` handler in `main.py` — envelope with `Code: 1`, **first error message only** |
| 422 / 500 | `GlobalExceptionMiddleware` |
| 401 | `jwt_error_handler` — no live path raises it |

## Endpoint groups

| Group | Prefix | Count | Auth | Reference |
| ----- | ------ | ----: | ---- | --------- |
| User & auth | `/user` | 10 | token (+ session on 4) | [user-auth.md](user-auth.md) |
| Masters | `/master` | 8 | token (+ session on 4) | [masters.md](masters.md) |
| Admin | `/admin_user` | 2 | token | [admin.md](admin.md) |
| Employee KYC | `/KYC` | 7 | token | [kyc.md](kyc.md) |
| Root | `/` | 1 | none | `{"message": "FastAPI MVC Running"}` |

**27 live endpoints + `GET /`.**

**Unregistered — 12 more:** `upload.py` (3), `query.py` (3), `library.py` (2) are commented out of
`main.py`; `otp_routes.py` (2) and `user_routes.py` (4) are never imported. See
[../modules/policy.md](../modules/policy.md).

## List payloads

`UserListRequest` and `EmployeeListRequest` share the same shape; every field is optional:

```json
{ "search": "", "filter": "", "startDate": null, "endDate": null,
  "sort": "createdAt", "order": "DESC", "limit": 10, "offset": 0 }
```

## Content types

| Situation | Content-Type |
| --------- | ------------ |
| Most requests | `application/json` |
| `POST /KYC/upload` | `multipart/form-data`, field `files` (repeatable) + `employee_id` |
| `DELETE /KYC/delete` | `employee_id` passed as a **header**, not a body or path param |
| All responses | `application/json` |

## No CORS, no rate limiting, no versioning

The backend registers no CORS middleware — correct for a same-origin BFF. There is no rate limiter and
no version prefix (the unused `API_VERSION` variable notwithstanding).

## Frontend consumption

**Only 12 of the 29 frontend handlers reach a live endpoint.** Before writing client code against any
endpoint here, check [frontend-contract-map.md](frontend-contract-map.md).
