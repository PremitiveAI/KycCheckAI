# Error Codes

The `Code` field is the **only reliable success/failure signal** — almost every response carries HTTP
200. `Code: 0` means success; anything else is a failure.

There is no central registry in the source. This table was assembled by tracing `error_response(...)`,
`throw_error_response(...)` and `JSONResponse(...)` calls.

## Table

| Code | HTTP | Meaning | Raised by |
| ---: | ---: | ------- | --------- |
| `0` | 200 | Success | `success_response()` |
| `1` | 400 | Request validation failed — **first Pydantic error only** | `RequestValidationError` handler, [`main.py:52`](../../backend/app/main.py) |
| `4002` | 200 | No files uploaded · empty search query | [`kyc_routes.py:58,67`](../../backend/app/routes/kyc_routes.py) |
| `5001` | 200 | `PK-apiToken` header missing | [`auth_middleware.py`](../../backend/app/middlewares/auth_middleware.py) |
| `5002` | 200 | `PK-apiToken` incorrect | `auth_middleware.py` |
| `422` | 422 | Validation error with a `details` array | `GlobalExceptionMiddleware` |
| `5000` | 500 | Unhandled server error | `GlobalExceptionMiddleware` |
| `4010` | 401 | Invalid or expired token | `jwt_error_handler` — **no live path raises it** |

Additional codes are raised inside `auth_service`, `employee_service`, `admin_service` and
`master_service` for validation and not-found conditions. Those service bodies were read structurally
rather than branch-by-branch, so **the complete set of business codes is not verified from the current
implementation.** Treat any non-zero `Code` as a failure and surface `Error.message`.

## Worked examples

**Missing token**

```json
{ "Success": null, "Code": 5001, "Error": { "message": "API Token required" } }
```

**Wrong token** — the most common setup mistake, and easy to miss because it is HTTP 200:

```json
{ "Success": null, "Code": 5002, "Error": { "message": "Invalid API Token" } }
```

**No files on upload**

```json
{ "Success": null, "Code": 4002, "Error": { "message": "No files uploaded" } }
```

**Empty search query**

```json
{ "Success": null, "Code": 4002, "Error": { "message": "Search query cannot be empty" } }
```

**Pydantic rejection** (HTTP 400, first error only):

```json
{ "Success": null, "Code": 1, "Error": { "message": "Field required" } }
```

## Recommended client handling

```ts
type Envelope<T> = {
  Success: { message?: string; data?: T } | null;
  Code: number;
  Error: { message: string } | null;
};

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);   // catches 400/422/500 only

  const body: Envelope<T> = await res.json();
  if (body.Code !== 0) throw new Error(body.Error?.message ?? `Code ${body.Code}`);

  return body.Success?.data as T;
}
```

Several existing frontend handlers check only `res.ok` and therefore treat `Code 5002` as success,
rendering an empty page instead of an error. See
[frontend-contract-map.md](frontend-contract-map.md).
