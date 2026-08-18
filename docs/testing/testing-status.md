# Testing Status

## Current state

**This repository contains no automated tests.**

Verified by exhaustive search across the whole repository (excluding `node_modules` and `venv`):

| Searched for | Found |
| ------------ | ----- |
| `test_*.py`, `*_test.py` | **None** |
| `*.test.ts(x)`, `*.spec.ts(x)` | **None** |
| `conftest.py`, `pytest.ini`, `tox.ini`, `setup.cfg`, `pyproject.toml` | **None** |
| `jest.config.*`, `vitest.config.*`, `playwright.config.*`, `cypress.config.*` | **None** |
| A `test` script in `package.json` | **None** |
| Test packages in `requirements.txt` (157 entries) | **None** — no `pytest`, `httpx`, `pytest-asyncio` |
| Test packages in `package.json` | **None** — no Jest, Vitest, Testing Library, Playwright |
| CI configuration (`.github/`, `.gitlab-ci.yml`, `Jenkinsfile`) | **None** |

`backend/test.db` exists and is **0 bytes** — an empty SQLite file, despite the project using MySQL.
It is not referenced by any code.

No unit, integration, API, contract, end-to-end or snapshot testing exists, and there is no coverage
measurement.

## Manual verification only

| Check | How |
| ----- | --- |
| Backend alive | `GET /` → `{"message": "FastAPI MVC Running"}` |
| Vector store loaded | `🔥 Global Vector DB Loaded — Count = <n>` on the console |
| Tables created | `✅ All tables created successfully!` |
| Token enforcement | Any endpoint without `PK-apiToken` → `Code 5001` |
| End-to-end | The smoke test in [../setup/local-development.md](../setup/local-development.md#first-end-to-end-run) |
| API exploration | Swagger at `/docs` |

Swagger is of limited help — `FastAPI()` is constructed without metadata and no route declares a
`response_model`, so `/docs` shows request schemas but no response shapes and no mention of the
`{Success, Code, Error}` envelope.

## Test data

No fixtures or factories exist. The repository does contain real uploaded artefacts under
`backend/storage/U-98WZ41BUTTOM/` and `backend/storage/U-UCLHKV1IAPK8/`, plus policy PDFs and JSON in
`backend/app/uploaded_pdfs/`.

> **These are real KYC documents.** Before using any of them as test fixtures, or committing them,
> confirm they contain no genuine personal data — they are PAN cards, Aadhaar cards and resumes by
> design.

## Risk assessment

Ranked by the cost of a silent regression:

| Area | Why it matters | Suggested first coverage |
| ---- | -------------- | ------------------------ |
| **Frontend↔backend contract** | 17 of 29 handlers are already broken and nobody noticed. This is the single highest-value test surface | A test that asserts every `${API_URL}…` target in `app/api/**` matches a registered FastAPI route |
| `extract_details` | Pure function over OCR text; the classification decides which of five tables a record lands in | Unit tests with recorded OCR text per document type, including the malformed-JSON fallback |
| `parse_search_query` | Pure function; drives the metadata filter that gates all retrieval | Unit tests per hint type — name, document type, Aadhaar, PAN, DOB |
| `clean_gemini_json` | Pure function; silent failure means empty results | Unit tests with fenced, trailing-comma and prose-wrapped inputs |
| Scoring in `handle_search_documents` | `1/(1+dist) + fuzz/100` determines result ordering | Unit test the ranking function with synthetic distances and names |
| `VectorStore.build_where_filter` | Translates filters into Chroma syntax; a wrong filter silently returns nothing | Unit tests per filter combination |
| Auth flow | Password hashing, session issuance and validation | Integration tests against a test database |
| Envelope contract | `{Success, Code, Error}` is a convention with nothing enforcing it | API tests asserting the shape on all 27 endpoints |

Note how many map to entries in [../../AUDIT.md](../../AUDIT.md). Issues 3, 6, 8, 10 and 13 are all
failures a modest test suite would have caught before they shipped.

## A pragmatic first suite

**1. Contract test — highest value, lowest effort.** Parse every `${API_URL}…` template literal in
`frontend/app/api/**/route.ts`, parse the registered routes from `app/main.py`, and assert every
frontend target resolves. This single test would have caught 17 defects.

**2. Backend unit tests** — no database, no network:

```
pytest over the pure functions:
  kyc_document_parser.extract_details      (mock the LLM call)
  kyc_document_parser.clean_gemini_json
  kyc_document_parser.parse_search_query
  kyc_document_parser.parse_date
  kyc_document_service scoring / normalize / chunk_text
  utils/crypto  encrypt_data / decrypt_data round-trip
```

**3. Backend API tests** — `httpx` + FastAPI `TestClient` against a throwaway MySQL database, asserting
the envelope, the error codes and the `PK-apiToken` gate across all 27 endpoints.

**4. Frontend unit tests** — Vitest over the handlers' URL construction and envelope unwrapping.

**5. End-to-end** — Playwright over signup → login → create employee → upload → search, with Gemini
stubbed.

**6. CI** — there is no pipeline at all; even lint plus the contract test would be a step change.

## Linting and static analysis

| Tool | Configured | Command |
| ---- | :--------: | ------- |
| ESLint | ✅ | `npm run lint` |
| TypeScript | Partially — `strict: true`, but **no script** | `npx tsc --noEmit` works |
| Prettier | ❌ | — |
| Ruff / Flake8 / Black / isort | ❌ | — |
| mypy | ❌ | — |

The backend has **no static analysis whatsoever**. Adding `ruff` would be one dependency and would
immediately surface the five broken `from services.X` imports in `rag_service.py`
([AUDIT.md](../../AUDIT.md) issue 11) and the unused imports across the services.

## The observation worth acting on

A KYC platform handling Aadhaar and PAN data has no automated verification of any kind. The contract
test in step 1 is roughly an afternoon's work and would have prevented the majority of the defects in
the audit — it is the highest-leverage thing available here.
