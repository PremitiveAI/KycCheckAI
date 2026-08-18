# Employee KYC API

Router: `public_router` (`/KYC`) in
[`app/routes/kyc_routes.py`](../../backend/app/routes/kyc_routes.py). Controller:
`EmployeeController`; services: `EmployeeService`, `kyc_document_service`.

All require `PK-apiToken`. A `protected_router` with the same `/KYC` prefix is declared and registered
but **has no routes attached**.

## Summary

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST | `/KYC/create` | Create or update an employee |
| GET | `/KYC/{employee_id}/details` | Employee with documents |
| POST | `/KYC/list` | Paginated list |
| POST | `/KYC/upload` | Upload and process documents |
| GET | `/KYC/search` | Semantic document search |
| GET | `/KYC/list-basic` | Minimal list |
| DELETE | `/KYC/delete` | Delete an employee |

---

## POST `/KYC/create`

**Schema:** `EmployeeCreate`

```json
{ "id": null, "emp_name": "Ramesh Kumar", "emp_id": null }
```

| Field | Type | Required |
| ----- | ---- | :------: |
| `id` | `Optional[str]` | no |
| `emp_name` | `str` | **yes** |
| `emp_id` | `Optional[str]` | no |

`emp_id` is `unique` and indexed on `tbl_employees`. How it is generated when omitted is **not verified
from the current implementation** — `EmployeeController.create` was not read line-by-line.

**Used by:** `/api/employee/create-employee` → `create-employee`, `upload-employee-doc` pages.

---

## GET `/KYC/{employee_id}/details`

Returns the employee and their extracted documents.

**Used by:** `/api/employee-details/[employeeKey]/details` → `upload-employee-doc`.

---

## POST `/KYC/list`

**Schema:** `EmployeeListRequest` — `search`, `filter`, `startDate`, `endDate`, `sort` (`createdAt`),
`order` (`DESC`), `limit` (10), `offset` (0). All optional.

**Used by:** `/api/employee/employee-list` → `employee-list`, `upload-employee-doc`.

---

## POST `/KYC/upload`

The core ingestion endpoint.

**Content-Type:** `multipart/form-data`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `files` | `List[UploadFile]` | Repeatable |
| `employee_id` | `str` | Query/form parameter, defaults to `""` |

```python
if not files:
    return error_response("No files uploaded", code=4002)
userId = "U-98WZ41BUTTOM"        # ← hard-coded
return handle_upload_documents(db, request, userId, employee_id, files)
```

Per file: save to `storage/{userId}/{employee_id}/` → OCR → Gemini classification and extraction →
insert into one of five typed tables → chunk → embed → ChromaDB.

Pipeline detail: [../modules/kyc.md](../modules/kyc.md).

> **The frontend does not call this endpoint.** `/api/employee/employee-upload` targets
> `document/upload?project_id=…`, which does not exist. Upload through the UI fails.
> [AUDIT.md](../../AUDIT.md) issue 8.

> **`userId` is hard-coded**, so all uploads share one tenant directory and one metadata tag.
> [AUDIT.md](../../AUDIT.md) issue 1.

**File type and size are not validated.**

---

## GET `/KYC/search`

**Query parameter:** `query` (string, required)

```python
request.state.userId = "U-98WZ41BUTTOM"     # ← overwrites the middleware value
if not query or not query.strip():
    return error_response("Search query cannot be empty", code=4002)
return handle_search_documents(db, request, query)
```

Parses the query for name, document type, Aadhaar number and PAN number; embeds it; searches ChromaDB
with `top_k=50` and a metadata filter; re-ranks with
`1/(1+distance) + rapidfuzz.partial_ratio(name)/100`; groups by `{document_type}_{record_id}`; returns
`build_answer(query, dataList)`.

Detail: [../modules/document-rag.md](../modules/document-rag.md).

**Used by:** `/api/chainlit/search` → `chainlit/search` page.

> The exact `build_answer` response shape is **not verified from the current implementation** — the
> function was located but not read line-by-line.

---

## GET `/KYC/list-basic`

Minimal employee list via `EmployeeController.list_basic`. No frontend caller found.

---

## DELETE `/KYC/delete`

```python
def delete_employee(employee_id: str = Header(...), db: Session = Depends(get_db)):
    return EmployeeService.delete_employee(db, employee_id)
```

> **`employee_id` is a required HTTP header**, not a path or query parameter — unusual, and easy to get
> wrong when writing a client. The frontend handler `/api/employee/delete-employee` sends it correctly.

**Used by:** `/api/employee/delete-employee` → `employee-list`.

---

## Error codes used here

| Code | Meaning |
| ---: | ------- |
| `0` | Success |
| `4002` | No files uploaded · empty search query |

Full table: [error-codes.md](error-codes.md).

## Not exposed

`handle_delete_document` exists in `kyc_document_service` but **no route calls it** — there is no way to
delete an individual document or its vectors through the API.
