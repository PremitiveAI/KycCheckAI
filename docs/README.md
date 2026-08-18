# Documentation Index

Documentation for **KYC Check AI & Document RAG** — a FastAPI + Next.js platform for employee KYC
document intake, LLM-based extraction, and vector retrieval.

Everything here is derived from the source. Where a fact could not be established from the repository
it is marked **Not verified from the current implementation.**

---

## Start here

| If you want to… | Read |
| --------------- | ---- |
| Understand the system end to end | [architecture/system-overview.md](architecture/system-overview.md) |
| Understand the KYC pipeline — the working core | [modules/kyc.md](modules/kyc.md) |
| Understand retrieval | [modules/document-rag.md](modules/document-rag.md) |
| Get it running | [setup/local-development.md](setup/local-development.md) |
| **Know which API calls actually work** | [api/frontend-contract-map.md](api/frontend-contract-map.md) |
| Know what is broken before you touch it | [../AUDIT.md](../AUDIT.md) |

---

## The three modules

This codebase contains three document modules at very different maturity levels. Read the one you are
working on.

| Module | Status | Document |
| ------ | ------ | -------- |
| **KYC** — employee document intake, OCR, classification, extraction | ✅ Live | [modules/kyc.md](modules/kyc.md) |
| **Document RAG** — embedding, vector search, fuzzy re-ranking | ✅ Live | [modules/document-rag.md](modules/document-rag.md) |
| **Policy** — insurance-policy extraction and Q&A | ❌ Not wired in | [modules/policy.md](modules/policy.md) |

---

## Architecture

| Document | Contents |
| -------- | -------- |
| [system-overview.md](architecture/system-overview.md) | Topology, BFF pattern, request lifecycle, stack |
| [backend-architecture.md](architecture/backend-architecture.md) | Routers, layering, middleware, envelope, logging |
| [frontend-architecture.md](architecture/frontend-architecture.md) | App Router, BFF handlers, session cookies, pages |
| [data-flow.md](architecture/data-flow.md) | Upload → OCR → extract → persist → embed → retrieve |

## API reference

| Document | Contents |
| -------- | -------- |
| [overview.md](api/overview.md) | Headers, envelope, conventions |
| [error-codes.md](api/error-codes.md) | Every `Code` value and its origin |
| [user-auth.md](api/user-auth.md) | `/user` — 10 endpoints |
| [masters.md](api/masters.md) | `/master` — 8 endpoints |
| [admin.md](api/admin.md) | `/admin_user` — 2 endpoints |
| [kyc.md](api/kyc.md) | `/KYC` — 7 endpoints |
| **[frontend-contract-map.md](api/frontend-contract-map.md)** | **Which of the 29 handlers reach a live endpoint** |

## Database

| Document | Contents |
| -------- | -------- |
| [schema.md](database/schema.md) | 16 models, columns, keys, relationships, ERD |

## Setup

| Document | Contents |
| -------- | -------- |
| [prerequisites.md](setup/prerequisites.md) | Runtimes, services, credentials |
| [backend-setup.md](setup/backend-setup.md) | Verified commands, with the UTF-16 workaround |
| [frontend-setup.md](setup/frontend-setup.md) | Install, env, dev server |
| [database-setup.md](setup/database-setup.md) | MySQL creation, auto table creation, no-migrations caveat |
| [environment-variables.md](setup/environment-variables.md) | 20 defined, 13 read, 11 unused |
| [local-development.md](setup/local-development.md) | Startup order, ports, verification |
| [docker.md](setup/docker.md) | The backend Dockerfile and its build blocker |

## Integrations, security, roadmap, testing, troubleshooting

| Document | Contents |
| -------- | -------- |
| [integrations/google-gemini.md](integrations/google-gemini.md) | Models, prompts, failure modes |
| [integrations/chromadb.md](integrations/chromadb.md) | Embedded mode, the three stores, collection layout |
| [security/authentication-and-authorization.md](security/authentication-and-authorization.md) | Token + session model, and its gaps |
| [roadmap/upcoming-features.md](roadmap/upcoming-features.md) | Real Estate / Excel and Chainlit search |
| [testing/testing-status.md](testing/testing-status.md) | No tests exist; proposed first suite |
| [troubleshooting/common-issues.md](troubleshooting/common-issues.md) | Symptom → cause → fix |

## Audit

| Document | Contents |
| -------- | -------- |
| [../AUDIT.md](../AUDIT.md) | 26 confirmed issues with file-and-line evidence |

---

## Conventions

- Verified statements cite a file and, where useful, a line number.
- Endpoint tables list the request shape exactly as the Pydantic schema defines it — no invented fields.
- Response examples show the real `{Success, Code, Error}` envelope, including that errors are returned
  with HTTP 200.
- Behaviour that is implemented but broken is documented as it actually behaves, cross-referenced to
  [../AUDIT.md](../AUDIT.md).
- Anything that could not be established from the repository says so explicitly.
