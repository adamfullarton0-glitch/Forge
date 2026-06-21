# FORGE backend

A small, production-grade API that gives FORGE **accounts** and **cross-device
sync**. Node + TypeScript (strict) · Fastify · Postgres (raw SQL, no ORM) ·
JWT auth · Zod validation. Fully tested (`npm test`, 32 tests incl. an in-memory-Postgres (pg-mem) contract suite, no live database
needed — routes run against an in-memory repo).

This is the real implementation behind the app's `AuthAdapter` / `SyncAdapter`
interfaces (`src/features/platform/` in the client). The app stays a great
offline-first PWA without it; this adds optional login + sync on top.

## What a production backend needs — and where it is here

| Requirement                | Status | Where                                                                      |
| -------------------------- | ------ | -------------------------------------------------------------------------- |
| Accounts (register/login)  | ✅     | `POST /auth/register`, `POST /auth/login`, bcrypt-hashed passwords         |
| Stateless auth (tokens)    | ✅     | JWT (`src/auth/tokens.ts`), `GET /auth/me`                                 |
| Data model + persistence   | ✅     | Postgres `users` + `snapshots` (`db/schema.sql`), raw SQL repos            |
| Cross-device sync          | ✅     | `GET /sync` (pull), `PUT /sync` (push) with optimistic concurrency (rev)   |
| Input validation           | ✅     | Zod on every body (`src/schemas.ts`)                                       |
| Conflict handling          | ✅     | `409` + server state on a stale push (last-writer must merge)              |
| Password security          | ✅     | bcrypt, generic 401s (no account-existence/ timing leak)                   |
| Transport security headers | ✅     | `@fastify/helmet`                                                          |
| CORS lockdown              | ✅     | `@fastify/cors` limited to your app origin(s)                              |
| Rate limiting (abuse)      | ✅     | `@fastify/rate-limit` (100 req/min/IP)                                     |
| Body-size limit (DoS)      | ✅     | 2 MB cap                                                                   |
| Config via env / secrets   | ✅     | `src/config.ts`, fails fast if `JWT_SECRET`/`DATABASE_URL` missing in prod |
| Health check               | ✅     | `GET /health` (for the platform's liveness probe)                          |
| Migrations                 | ✅     | idempotent `db/schema.sql` via `npm run migrate` (runs on deploy)          |
| Tests                      | ✅     | Vitest — routes, auth, and the real SQL via pg-mem; no DB required         |
| Containerised deploy       | ✅     | multi-stage `Dockerfile`                                                   |
| Graceful shutdown          | ✅     | SIGTERM/SIGINT close server + pool                                         |

**Deliberately out of scope** (add when needed): refresh-token rotation,
email verification / password reset (needs an email provider), OAuth logins,
and per-user encryption at rest. The structure leaves clean seams for all of
these.

## API

| Method & path         | Auth | Body                  | Returns                                             |
| --------------------- | ---- | --------------------- | --------------------------------------------------- |
| `GET /health`         | –    | –                     | `{ ok }`                                            |
| `POST /auth/register` | –    | `{ email, password }` | `201 { token, user }` · `409` if taken              |
| `POST /auth/login`    | –    | `{ email, password }` | `{ token, user }` · `401`                           |
| `GET /auth/me`        | JWT  | –                     | `{ user }` · `401`                                  |
| `GET /sync`           | JWT  | –                     | `{ data, rev, updatedAt }`                          |
| `PUT /sync`           | JWT  | `{ data, baseRev }`   | `{ rev, updatedAt }` · `409 { server }` on conflict |

Sync model: each user has one snapshot (the client's full validated app-state
blob). The client pulls `{ data, rev }`, edits locally, and pushes `{ data,
baseRev: rev }`. If the server moved on, it returns `409` with the current
server snapshot so the client can merge and retry. Simple, robust last-writer
-wins with conflict detection.

## Run locally

```bash
cd server
cp .env.example .env        # set JWT_SECRET; DATABASE_URL optional for dev
npm install
npm test                    # 32 tests (incl. pg-mem SQL contract), no DB needed
npm run dev                 # needs a Postgres DATABASE_URL to actually serve
```

With a local Postgres:

```bash
createdb forge
export DATABASE_URL=postgres://localhost:5432/forge
export JWT_SECRET=$(openssl rand -base64 48)
npm run migrate             # apply db/schema.sql (idempotent)
npm run dev                 # http://localhost:8080/health
```

## Deploy (pick one)

All you need is a Node host + a Postgres database. Set the env vars from
`.env.example` (a strong `JWT_SECRET`, the `DATABASE_URL`, and
`CORS_ORIGINS=https://adamfullarton0-glitch.github.io`).

- **Render / Railway / Fly.io (Docker):** point it at this `server/` folder; the
  `Dockerfile` builds, runs `migrate`, then `server`. Add a managed Postgres and
  set the env vars. Expose port `8080`.
- **Render (no Docker):** Build `npm install && npm run build`, Start
  `npm run migrate && npm start`.
- **Supabase / Neon for Postgres + any Node host:** create the DB, copy its
  connection string into `DATABASE_URL`, deploy the Node app.

## Connect the app to it

The client ships with `VITE_API_URL` unset, so it stays fully local. Once the
backend is live, set `VITE_API_URL=https://your-api-host` at build time and the
app's `platform` registry uses the remote auth + sync adapters instead of the
local stubs (no screen changes). A sign-in screen is the remaining client task.
