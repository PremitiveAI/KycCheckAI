# User & Authentication API

Routers: `public_router` and `protected_router`, both `/user`, in
[`app/routes/login_routes.py`](../../backend/app/routes/login_routes.py). Controller: `AuthController`;
service: `auth_service.py` (817 lines).

## Summary

| Method | Path | Auth | Schema |
| ------ | ---- | ---- | ------ |
| POST | `/user/signup` | token | `SignupRequest` |
| POST | `/user/login` | token | `LoginRequest` |
| POST | `/user/login-email` | token | `EmailLoginSchema` |
| POST | `/user/generate-otp` | token | `OTPGenerateRequest` |
| POST | `/user/validate-otp` | token | `OTPValidateRequest` |
| PUT | `/user/update-password` | token | `PasswordUpdate` |
| POST | `/user/logout` | token + **session** | — |
| POST | `/user/list_users` | token + **session** | `UserListRequest` |
| POST | `/user/updateUser` | token + **session** | `UpdateUserRequest` |
| GET | `/user/getUser` | token + **session** | — |

Protected routes carry `Depends(SwaggerSessionHeaders), Depends(verify_session)`.

## Request schemas — verified

```python
class SignupRequest(BaseModel):        # all Optional — no field is enforced by Pydantic
    username: Optional[str] = None
    mobile:   Optional[str] = None
    password: Optional[str] = None
    email:    Optional[str] = None

class LoginRequest(BaseModel):         # both Optional
    mobile:   Optional[str] = None
    password: Optional[str] = None

class EmailLoginSchema(BaseModel):
    email: str                          # required

class OTPGenerateRequest(BaseModel):
    mobile: Optional[str] = None

class OTPValidateRequest(BaseModel):
    mobile: Optional[str] = None
    otp: int                            # required

class PasswordUpdate(BaseModel):
    mobile_number:    Optional[str] = None
    new_password:     Optional[str] = None
    confirm_password: Optional[str] = None

class UpdateUserRequest(BaseModel):     # no defaults — all keys must be present, values may be null
    companyName: Optional[str]; username: Optional[str]; mobile: Optional[str]
    email: Optional[str]; country: Optional[str]; state: Optional[str]
    city: Optional[str]; pincode: Optional[str]; address: Optional[str]
    gst: Optional[str]; pan: Optional[str]

class UserListRequest(BaseModel):
    search: Optional[str] = ""; filter: Optional[str] = ""
    startDate: Optional[str] = None; endDate: Optional[str] = None
    sort: Optional[str] = "createdAt"; order: Optional[str] = "DESC"
    limit: Optional[int] = 10; offset: Optional[int] = 0
```

> **Nearly every auth field is `Optional`.** Pydantic will accept `{}` for signup and login. Required-ness
> is enforced in `auth_service`, not at the schema boundary — so a missing field produces a business
> error in the envelope rather than an HTTP 400.
>
> `UpdateUserRequest` is the exception: its fields are `Optional[str]` **without defaults**, so every
> key must be present in the payload even if null.

## Validation — service layer

`auth_service.py` implements nine validators: `validate_username`, `validate_mobile`,
`validate_password`, `validate_email`, `validate_company_name`, `validate_country`, `validate_state`,
`validate_city`, `validate_pincode`. Their exact rules were **not read line-by-line** and are
**not verified from the current implementation**.

## Login flow

```python
if not AuthService.verify_password(password, user.password):   # pbkdf2_sha256
    ...
token = encrypt_data({...})                                    # Fernet, keyed from TOKEN_SECRET
session = Sessions(userId=user.userId, session_token=token)
# response includes: session_token, username
```

The frontend handler reads `Success.data.session_token` and `Success.data.username`, storing the token
in an `httpOnly` cookie and the username in a readable one.

## Frontend usage

| Endpoint | Handler | Status |
| -------- | ------- | ------ |
| `user/login` | `/api/login` | ✅ |
| `user/signup` | `/api/sign-up` | ✅ |
| `user/login-email` | `/api/google/callback` | ✅ |
| `user/getUser` | `/api/get-user` | ✅ |
| `user/updateUser` | `/api/profile-update` | ✅ |
| `user/update-password` | `/api/change-password` → calls `update-password` | ❌ **missing `user/` prefix** |
| `user/generate-otp` | `/api/generate-otp` → calls `generate-otp` | ❌ **missing prefix** |
| `user/validate-otp` | `/api/validate-otp` → calls `validate-otp` | ❌ **missing prefix** |
| `user/logout` | `/api/logout` → calls `logout`, **and never sends the request** | ❌ |
| `user/list_users` | `/api/user-list` → calls `/employee/list` | ❌ **wrong target** |

Five of ten are unreachable. See [frontend-contract-map.md](frontend-contract-map.md) and
[AUDIT.md](../../AUDIT.md) issues 3, 6 and 8.

## Unregistered duplicates

`app/routes/otp_routes.py` defines `/generate-otp` and `/validate-otp` at the **root** — matching what
the frontend calls. It is never imported. Registering it would fix the OTP handlers without touching
the frontend, but would duplicate the `/user/*` versions.

`app/routes/user_routes.py` defines a `/users` CRUD router — also never imported.
