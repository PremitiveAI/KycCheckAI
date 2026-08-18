# Frontend ↔ Backend Contract Map

The single most useful table in this documentation set: which of the **29** Next.js route handlers
actually reaches one of the **27** live backend endpoints.

**Only 12 do.**

Every row was verified by reading the handler source and comparing against the routers registered in
[`app/main.py`](../../backend/app/main.py).

---

## ✅ Working — 12

| Frontend handler | Method | Backend endpoint | Used by page |
| ---------------- | ------ | ---------------- | ------------ |
| `/api/login` | POST | `user/login` | `login` |
| `/api/sign-up` | POST | `user/signup` | `sign-up` |
| `/api/google/callback` | GET | `user/login-email` | `login` (OAuth return) |
| `/api/get-user` | GET | `user/getUser` | `profile-update` |
| `/api/profile-update` | POST | `user/updateUser` | `profile-update` |
| `/api/feature-list` | POST | `master/feature/list` | `generate-auth` |
| `/api/profile-feature-list` | POST | `master/category/list` | `generate-auth` |
| `/api/employee/create-employee` | POST | `KYC/create` | `create-employee`, `upload-employee-doc` |
| `/api/employee/employee-list` | POST | `KYC/list` | `employee-list`, `upload-employee-doc` |
| `/api/employee/delete-employee` | DELETE | `KYC/delete` | `employee-list` |
| `/api/employee-details/[employeeKey]/details` | GET | `KYC/{employee_id}/details` | `upload-employee-doc` |
| `/api/chainlit/search` | POST | `KYC/search` | `chainlit/search` |

`/api/google` is a thirteenth handler that makes no backend call — it redirects to Google's consent
screen.

---

## ❌ Missing the `user/` prefix — 4

The backend route **exists**, at a different path. These are one-word fixes.

| Frontend handler | Calls | Backend actually exposes | Breaks |
| ---------------- | ----- | ------------------------ | ------ |
| `/api/change-password` | `update-password` | `user/update-password` | Password change |
| `/api/generate-otp` | `generate-otp` | `user/generate-otp` | OTP request |
| `/api/validate-otp` | `validate-otp` | `user/validate-otp` | OTP verification |
| `/api/logout` | `logout` | `user/logout` | Logout — **and the request is never sent at all**, see [AUDIT](../../AUDIT.md) issue 3 |

---

## ❌ Target a commented-out router — 5

These are the **Policy module**. The routers exist in the codebase but are commented out at
[`app/main.py:9-11, 29-30`](../../backend/app/main.py).

| Frontend handler | Calls | Lives in | Used by page |
| ---------------- | ----- | -------- | ------------ |
| `/api/upload` | `upload` | `routes/upload.py` | `upload-file` |
| `/api/downloadPdf/[fileHash]` | `download?file_hash=` | `routes/upload.py` | `upload-file`, `policy-list`, `search` |
| `/api/policy-list` | `policies` | `routes/query.py` | `policy-list` |
| `/api/policyDetail/[fileHash]` | `query?file_hash=` | `routes/query.py` | `policy-list` |
| `/api/search` | `query?q=` | `routes/query.py` | `search` |

Re-enabling them requires uncommenting the imports **and** fixing the four defects in
[`rag_service.py`](../modules/policy.md).

---

## ❌ No backend at all — 7

| Frontend handler | Calls | Reality |
| ---------------- | ----- | ------- |
| `/api/upload-document` | `documents/upload` | No `documents` router exists anywhere |
| `/api/search-doc` | `documents/search?query=&limit=&offset=` | same |
| `/api/deleteDoc/[documentId]` | `documents/{id}` | same |
| `/api/downloadDoc` | `documents/download?file_url=` | same |
| `/api/upload-excel` | `upload_excel/` | No such endpoint |
| `/api/user-list` | `/employee/list` | No `/employee` router — the equivalent is `KYC/list`. Also double-slashes: `` `${API_URL}/employee/list` `` |
| `/api/employee/employee-upload` | `document/upload?project_id=` | Should be `KYC/upload` |

The first four back the sidebar module labelled **"KYC"** — which is therefore entirely
non-functional, while the module labelled **"Employee"** works.

---

## ❌ Pages calling handlers that do not exist — 2

| Page | Calls | Reality |
| ---- | ----- | ------- |
| `employee/upload-employee-doc:356` | `/api/employee-document/` | No such handler |
| `excel-list:35,51` | `/api/query/RES-1001`, `/api/query/RES-1002` | No such handler; IDs hard-coded |

---

## The naming inversion

This trips up every reader, so it is worth stating plainly.

```
Sidebar "Employee"  →  /api/employee/*        →  /KYC/*        ✅ works
Sidebar "KYC"       →  /api/upload-document   →  documents/*   ❌ does not exist
                       /api/search-doc
                       /api/document-history → /api/search-doc
```

The **working KYC implementation is reached through the "Employee" menu.** The menu labelled "KYC"
points at an unimplemented `documents/*` API.

---

## Module status by sidebar entry

| Sidebar | Pages | Backend | Status |
| ------- | ----- | ------- | ------ |
| Dashboard | `dashboard` | none | Static |
| Analytics | `Analytics` | none — Recharts on local state | Static |
| **Policies** | `upload-file`, `policy-list`, `search` | `upload.py`, `query.py` | ❌ routers disabled |
| **Employee** | `create-employee`, `upload-employee-doc`, `employee-list`, `search-employee-doc` | `/KYC/*` | ✅ working (except `employee-upload`) |
| **Real Estate** | `upload-excel`, `search-excel` | `upload_excel/` | ❌ no backend — see [roadmap](../roadmap/upcoming-features.md) |
| **KYC** | `upload-document`, `document-history`, `search-document` | `documents/*` | ❌ no backend |
| Search | `chainlit/search` | `KYC/search` | ✅ working |
| Setting | `profile-update`, `generate-auth` | `user/updateUser`, `master/*/list` | ✅ working |

---

## Headers sent by the BFF layer

Every handler attaches `PK-apiToken` from the server-side `API_TOKEN`. Handlers for protected routes
additionally read the `session_token` httpOnly cookie and send it as `PK-sessionToken`:

```ts
const cookieStore = await cookies();
const token = cookieStore.get("session_token")?.value;
// …
headers: {
  "PK-apiToken": API_TOKEN,
  "PK-sessionToken": token,
}
```

Some handlers also send `PK-role: "User"`, `PK-country: "IN"` and `PK-timezone: "Asia/Kolkata"`. The
backend reads `PK-country` and `PK-timezone` into `request.state`; **`PK-role` is never read**.

---

## Fixing the map

In rough order of value per unit of effort:

1. **Add the `user/` prefix** to four handlers — restores password change, both OTP flows and logout.
2. **Send the logout request** — the config object is already built; it is simply never executed.
3. **Point `employee/employee-upload` at `KYC/upload`** — restores document upload from the Employee
   module.
4. **Decide the fate of `documents/*`** — either implement the router or retire the "KYC" sidebar
   module and fold its pages into "Employee".
5. **Re-enable or retire the Policy routers** — see [modules/policy.md](../modules/policy.md).
6. Fix the `user-list` double slash and repoint it at `KYC/list`.
