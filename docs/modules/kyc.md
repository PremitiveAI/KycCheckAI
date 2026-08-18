# Module — KYC

The working core of the product: employee identity and credential documents are uploaded, OCR'd,
classified by an LLM, extracted into typed fields, and persisted into five document tables.

**Status:** ✅ Live. Routers registered at [`app/main.py:37-38`](../../backend/app/main.py).

## Business purpose

Employee onboarding requires collecting and verifying identity documents (PAN, Aadhaar), proof of
address, educational qualifications and a resume. This module removes the manual data-entry step: a
recruiter uploads whatever the candidate sent, and the system determines what each file is and pulls
the relevant fields out of it.

## User flow

1. **Employee → Add Employee** (`/employee/create-employee`) — creates an employee record with an
   `emp_name`; `emp_id` is optional.
2. **Employee → Upload Documents** (`/employee/upload-employee-doc`) — select an employee, upload one
   or more files.
3. Each file is classified and its fields extracted automatically. No document type is chosen by hand.
4. **Employee → Employee List** (`/employee/employee-list`) — browse, view details, delete.
5. Retrieval is covered by [document-rag.md](document-rag.md).

## Frontend flow

```
upload-employee-doc page
  → GET  /api/employee/employee-list      → POST /KYC/list
  → POST /api/employee/create-employee    → POST /KYC/create
  → GET  /api/employee-details/{key}/details → GET /KYC/{employee_id}/details
  → POST /api/employee/employee-upload    → ❌ targets `document/upload?project_id=` — see below
```

> **The upload handler is misrouted.** `/api/employee/employee-upload` calls
> `document/upload?project_id=…`, which does not exist; the working endpoint is `POST /KYC/upload`.
> Uploading through the UI therefore fails. [AUDIT.md](../../AUDIT.md) issue 8.

## Backend flow

```
POST /KYC/upload   (files[], employee_id)
  ↓ kyc_routes.py:56
  userId = "U-98WZ41BUTTOM"                  ← hard-coded, ignores the session
  ↓ handle_upload_documents(db, request, userId, employee_id, files)
  ↓ for each file:  _process_single_file
      save_local_file(user_id, employee_id, file)   → storage/{userId}/{employee_id}/{safe_name}
      ocr_extract_text(path)
      extract_details(text)                          → Gemini: classify + 18 fields
      save_document_and_get_id(db, emp_id, details)  → one of five tables
      chunk_text(text, size=50_000)
      gen_embedding(chunk)                           → models/text-embedding-004
      vector_db.add_vector(vector, metadata, document_details)
  ↓ success_response
```

### OCR — `ocr_extract_text`

Dispatches on file extension ([`kyc_document_parser.py:162`](../../backend/app/utils/kyc_document_parser.py)):

| Type | Handling |
| ---- | -------- |
| PDF | PyMuPDF (`fitz`) opens the document; pages are rendered to PIL images and sent to Gemini Vision |
| Image | Base64-encoded and sent to Gemini Vision directly |
| DOCX | `python-docx` reads paragraphs — no LLM call |

### Classification and extraction — `extract_details`

A single Gemini call does both. The prompt is strict:

- Output **STRICT JSON ONLY** — no markdown, comments or explanations
- Do **not** hallucinate missing values; absent fields become `""` or `null`
- Always return `name` and `address` **in English**, transliterating if the OCR text is in another
  script
- Always return `doc_number` with **all whitespace removed**

**Document types:** `aadhaar_card` · `pan_card` · `resume` · `address_proof` (electricity_bill,
gas_bill) · `qualification` (marksheet, degree, diploma, certificate) · `other`

**Output schema — 18 fields:**

```json
{
  "document_type": "", "address_proof_type": "", "name": "", "doc_number": "",
  "dob": "", "gender": "", "address": "", "mobile": "", "email": "",
  "job_role": "", "work_experience_years": null, "last_company": "", "skills": [],
  "highest_qualification": "", "institute_name": "", "specialization": "",
  "year_of_passing": "", "extra": {}
}
```

The response passes through `clean_gemini_json` (strips fences, trailing commas, extracts the first
JSON object). On any parse failure the function returns a stub with `document_type: "other"` and the
raw model output under `extra.raw_output` — **the record is still saved**, so a failed extraction is
indistinguishable from a genuinely unclassifiable document. [AUDIT.md](../../AUDIT.md) issue 21.

## Database interaction

`save_document_and_get_id` routes the extracted fields into one of five tables by `document_type`:

| `document_type` | Table | Type-specific columns |
| --------------- | ----- | --------------------- |
| `pan_card` | `tbl_pan` | `pan_number`, `date_of_birth`, `father_name` |
| `aadhaar_card` | `tbl_aadhaar` | `aadhaar_number`, `date_of_birth_or_yob`, `gender`, `address(500)` |
| `resume` | `tbl_resume` | `email`, `mobile_number`, `total_experience_years`, `last_company`, `skills(225)` |
| `address_proof` | `tbl_address_proof` | `address(225)` **NOT NULL**, `document_name`, `issue_date` |
| `qualification` | `tbl_qualification` | `highest_qualification`, `institute_name`, `specialization`, `year_of_passing` |

All five share `id`, `emp_id` (indexed), `full_name`, `file_path(1024)`, `status` and the six audit
columns. Full detail: [../database/schema.md](../database/schema.md).

Two helpers shape resume data before storage: `_last_company(details)` and `_skills(details)`.

## API details

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST | `/KYC/create` | Create employee — `EmployeeCreate {id?, emp_name, emp_id?}` |
| GET | `/KYC/{employee_id}/details` | Employee with documents |
| POST | `/KYC/list` | Paginated list — `EmployeeListRequest` |
| POST | `/KYC/upload` | **Upload and process documents** |
| GET | `/KYC/search` | Semantic search — see [document-rag.md](document-rag.md) |
| GET | `/KYC/list-basic` | Minimal list |
| DELETE | `/KYC/delete` | Delete — `employee_id` in a **header** |

Full reference: [../api/kyc.md](../api/kyc.md).

## Validation

| Layer | Rule |
| ----- | ---- |
| Route | `if not files: return error_response("No files uploaded", code=4002)` |
| Route | Search rejects empty/whitespace queries with `code=4002` |
| Pydantic | `EmployeeCreate` requires only `emp_name` |
| Filename | `secure_filename` strips unsafe characters before writing to disk |

**File type and size are not validated.** Any upload is accepted; `detect_file_type` classifies
unknown types and extraction simply yields nothing.

## Authentication

`PK-apiToken` only — `/KYC/*` routes are on the **public** router. The protected KYC router is declared
but has **no routes attached**.

> `userId` is hard-coded to `"U-98WZ41BUTTOM"` at [`kyc_routes.py:59`](../../backend/app/routes/kyc_routes.py)
> for upload and again at line 65 for search, where it **overwrites** whatever the middleware set. All
> documents therefore share one tenant. [AUDIT.md](../../AUDIT.md) issue 1.

## Error handling

| Situation | Result |
| --------- | ------ |
| No files | `Code 4002` |
| Empty search query | `Code 4002` |
| OCR/extraction failure | Stub record with `document_type: "other"` — **saved anyway** |
| Gemini network/quota failure | Propagates → HTTP 500 |
| Per-file exception during batch upload | Collected; the batch continues |

## Dependencies

`PyMuPDF` (PDF), `python-docx` (DOCX), `Pillow` (image handling), `langchain-google-genai`
(Gemini + embeddings), `chromadb`, `RapidFuzz` (search re-ranking), `SQLAlchemy`, `PyMySQL`.

## Known limitations

1. **Single tenant.** The hard-coded `userId` defeats per-user isolation on both write and read.
2. **The UI upload path is broken** — `/api/employee/employee-upload` targets a non-existent endpoint.
3. **Uploaded identity documents are publicly downloadable** via the `/storage` static mount.
4. **No file type or size validation.**
5. **Failed extractions are persisted** as `other` with empty fields.
6. **Chunking is effectively disabled** — `size=50_000`, no overlap.
   [document-rag.md](document-rag.md).
7. **No document-level deduplication** — re-uploading the same file creates another row and another
   vector.
8. `handle_delete_document` exists in the service but **no route exposes it**.
9. The sidebar menu labelled "KYC" does **not** reach this module — it calls an unimplemented
   `documents/*` API. Use **Employee**. See [../api/frontend-contract-map.md](../api/frontend-contract-map.md).
