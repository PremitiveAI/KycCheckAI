# Admin API

Router: `admin_router` (`/admin_user`) in
[`app/routes/admin_routes.py`](../../backend/app/routes/admin_routes.py). Controller:
`AdminController`; service: `admin_service.py` (285 lines).

Registered at [`app/main.py:36`](../../backend/app/main.py). **2 endpoints.**

## Summary

| Method | Path | Auth | Schema |
| ------ | ---- | ---- | ------ |
| POST | `/admin_user/signup` | `PK-apiToken` | `SignupRequest` |
| POST | `/admin_user/login` | `PK-apiToken` | `LoginRequest` |

```python
@admin_router.post("/signup")
async def signup(request: SignupRequest, response: Response, db: Session = Depends(get_db)):
    return AdminController.signup(db, request)

@admin_router.post("/login")
async def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    return AdminController.login(db, request)
```

## Request schemas

Shared with the user auth module — see [user-auth.md](user-auth.md):

```python
class SignupRequest(BaseModel):
    username: Optional[str] = None
    mobile:   Optional[str] = None
    password: Optional[str] = None
    email:    Optional[str] = None

class LoginRequest(BaseModel):
    mobile:   Optional[str] = None
    password: Optional[str] = None
```

Every field is `Optional`, so Pydantic accepts `{}`. Required-ness is enforced inside `admin_service`.

## Database

| Table | Key columns |
| ----- | ----------- |
| `tbl_admin` | `userId` String(100) **unique**, auto-generated · `admin_name` · `mobile` String(10) **unique, indexed** · `password` String(255) · `email` **NOT NULL** · `role` String(150) · `status` |
| `tbl_admin_sessions` | `userId` FK → `tbl_admin.userId` · `session_token` NOT NULL · `deviceId` · `sessionType` default `WEB` · `status` |

`tbl_admin` exposes a `sessions` relationship with `cascade="all, delete-orphan"`.

`tbl_admin.id` is also the target of the `createdBy` / `updatedBy` foreign keys on
`tbl_category_master` and `tbl_feature_type_master` — see [masters.md](masters.md).

## Roles

`tbl_admin.role` exists as a `String(150)` column but **is never read for any authorization decision**.
There is no role-based access control anywhere in the codebase, and no endpoint distinguishes an admin
session from a user session.

## Session verification

The commented-out block at [`admin_routes.py:25-27`](../../backend/app/routes/admin_routes.py) shows the
intent to add `SwaggerSessionHeaders` + `verify_session` to this router:

```python
# admin_router = APIRouter(
#     prefix="/admin_user", tags=["Admin_User"],
#     dependencies=[Depends(SwaggerSessionHeaders), Depends(verify_session)]
# )
```

As registered, both endpoints require only `PK-apiToken`. That is correct for signup and login, which
must be reachable without a session — but it means **there are no protected admin endpoints at all**.

## Frontend usage

**None.** No frontend handler or page calls `/admin_user/*`. There is no admin login screen. Admin
accounts can only be created and used through Swagger or direct API calls.

## Known limitations

1. **No admin UI** — the module is API-only.
2. **`role` is never enforced** — an admin session grants nothing a user session does not.
3. **No protected admin endpoints** — the session-gated router variant is commented out.
4. **Signup is open** — `/admin_user/signup` requires only the shared `PK-apiToken`, so anyone holding
   that token can create an administrator. Combined with the absence of role checks this is currently
   low-impact, but it becomes significant the moment roles are enforced.
