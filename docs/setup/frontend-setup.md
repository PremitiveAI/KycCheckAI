# Frontend Setup

All commands come from [`frontend/package.json`](../../frontend/package.json).

> `frontend/README.md` is the **unmodified create-next-app scaffolding**. It documents generic
> `npm run dev` / `yarn dev` / `pnpm dev` / `bun dev` options and tells you to edit `app/page.tsx` —
> a file that does not exist in this project. Ignore it. [AUDIT.md](../../AUDIT.md) issue 26.

## Step 1 — Check Node and npm

```bash
cd frontend
node -v
npm -v
```

**The required Node version is not verified from the current implementation** — there is no `engines`
field in `package.json` and no `.nvmrc`. Next.js 16 requires Node 18.18+ as a floor; use an active LTS.

Only `package-lock.json` is present, so **npm is the package manager**.

## Step 2 — Install

```bash
npm i
```

## Step 3 — Configure environment

Create `frontend/.env.local` — no env file is committed and there is no `.env.example`.

```ini
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/
API_TOKEN=<same value as backend API_TOKEN>

# only needed for "Sign in with Google"
CLIENT_ID=<REDACTED>
CLIENT_SECRET=<REDACTED>
REDIRECT_URI=http://localhost:3000/api/google/callback
```

Three things matter:

**Include the trailing slash on `NEXT_PUBLIC_API_URL`.** Handlers are inconsistent — most normalise
with `API_URL.replace(/\/$/, "")` and tolerate either form, several concatenate directly
(`` `${API_URL}user/login` ``) and require it, and `user-list` double-slashes when it is present. The
slash satisfies the majority.

**`API_TOKEN` must not carry a `NEXT_PUBLIC_` prefix.** It is imported only by server-side route
handlers, so Next.js keeps it out of the client bundle. Adding the prefix would publish your shared
token to every visitor.

**The OAuth variables are `CLIENT_ID`, `CLIENT_SECRET` and `REDIRECT_URI`** — not the
`GOOGLE_CLIENT_ID` / `GOOGLE_REDIRECT_URI` names exported from `app/utils/api.ts`, which are unused.
`REDIRECT_URI` must exactly match the redirect URI registered in the Google Cloud Console.

Full inventory: [environment-variables.md](environment-variables.md).

## Step 4 — Development server

```bash
npm run dev
```

The script is plain `next dev` with no `-p` flag, so it serves on **<http://localhost:3000>**. The root
path redirects to `/home`.

## Step 5 — Production

```bash
npm run build
npm run start
```

There is **no Dockerfile for the frontend** and no compose file — only the backend is containerised.

## Step 6 — Lint

```bash
npm run lint
```

Runs `eslint` with `eslint-config-next`.

## Step 7 — Tests and type-checking

**Not verified from the current implementation.** `package.json` defines no `test` and no type-check
script, and no testing framework is installed. TypeScript is present with `strict: true`, so this works
although the repository does not define it:

```bash
npx tsc --noEmit
```

## Step 8 — Verify

1. <http://localhost:3000> → redirects to `/home`, showing "Welcome to Our AgenticAI".
2. Sign up or log in — `/login` calls `/api/login` → `user/login`.
3. After login, open **Employee → Employee List**. This is the working module.
4. Browser Network tab: calls go to `localhost:3000/api/...`, **never** directly to `:8000`.
5. No `PK-apiToken` or `PK-sessionToken` should be visible in browser requests — both are added
   server-side.

> Expect several menus to fail. Only 12 of 29 handlers reach a live endpoint — **Policies**,
> **Real Estate** and the menu labelled **KYC** are all non-functional. Use **Employee** and
> **Search**. See [../api/frontend-contract-map.md](../api/frontend-contract-map.md).

## Command reference

| Purpose | Command | Verified from |
| ------- | ------- | ------------- |
| Install | `npm i` | `package-lock.json` |
| Development server (port 3000) | `npm run dev` | `package.json` scripts |
| Production build | `npm run build` | `package.json` scripts |
| Production server | `npm run start` | `package.json` scripts |
| Lint | `npm run lint` | `package.json` scripts |
| Node version | — | **Not verified from the current implementation** |
| Tests / type check / format | — | **Not verified from the current implementation** |

## Dependencies

| Package | Used | Imported |
| ------- | ---- | :------: |
| `next`, `react`, `react-dom` | Framework | ✅ |
| `axios` | Most BFF handlers | ✅ |
| `lucide-react`, `@heroicons/react` | Icons | ✅ |
| `recharts` | Analytics charts | ✅ |
| `uuid` | IDs | ✅ |
| `xlsx` | Excel parsing — Real Estate module | ✅ |
| `mammoth`, `pdf-parse`, `tesseract.js` | Client-side document parsing | ❌ not imported |
| `express`, `express-session`, `cookie-parser`, `openid-client` | Server / auth | ❌ not imported |
| `dotenv` | — | ❌ Next.js loads `.env.local` natively |

`tesseract.js`, `pdf-parse` and `mammoth` suggest an abandoned plan to do OCR in the browser; all OCR
happens server-side via Gemini.
