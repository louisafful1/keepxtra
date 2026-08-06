# Developer Guide

## Repository layout

```
KeepXtra/
├── frontend/    Vite + React + TypeScript app (marketing site, admin portal, farmer portal)
├── backend/     Express + TypeScript + MongoDB API
├── docs/        This documentation
├── pitch-deck/  Standalone investor pitch-deck generator (unrelated to the app runtime)
└── .github/     CI workflows
```

Frontend and backend are two independent npm projects — each has its own `package.json`, `node_modules`, and lockfile. There is no shared root `package.json`; run every command from inside the relevant folder.

## Getting started

**Option A — npm directly:**

```bash
# Backend
cd backend
npm install
cp .env.example .env   # then fill in real values — see docs/security
npm run dev              # tsx watch src/server.ts, http://localhost:4000
npm run seed              # first time only — permissions/roles/(optional) super admin

# Frontend (separate terminal)
cd frontend
npm install
npm run dev              # vite, http://localhost:5173
```

**Option B — Docker Compose** (backend + MongoDB + Redis, zero config, real values already baked in as local-only dev defaults):

```bash
docker compose up --build
```

Then run the frontend separately with `npm run dev` as above (not containerized for local dev). See [docs/deployment/docker.md](../deployment/docker.md).

## Common commands

| Command | Frontend | Backend |
|---|---|---|
| Dev server | `npm run dev` | `npm run dev` |
| Type check | `npm run build` (runs `tsc -b`) | `npm run typecheck` (`src/`) + `npm run lint` (also type-checks `tests/`/`scripts/` via `tsconfig.eslint.json`) |
| Lint | `npm run lint` (oxlint) | `npm run lint` (ESLint) |
| Test | — | `npm test` (Vitest) / `npm run test:coverage` |
| Production build | `npm run build` | `npm run build` |
| Seed baseline data | — | `npm run seed` |
| Run migrations | — | `npm run migrate` |
| Backup / restore | — | `npm run backup` / `npm run restore -- <path>` |

## Backend architecture

The backend follows a strict layered architecture — see [docs/architecture](../architecture/BACKEND_ARCHITECTURE.md) for the full design:

```
Routes → Validators (Zod) → Controllers (thin) → Services (business logic) → Repositories (DB access) → Mongoose Models
```

Cross-cutting concerns (RBAC permission checks, audit logging, event-driven auto-creation between modules) are documented per-module in that same file.

## Testing

Backend tests run against a disposable in-memory MongoDB instance (`mongodb-memory-server`) — no real database needed. See `backend/tests/setup.ts`. Run `npm test` from `backend/` for the full suite, or `npm run test:coverage` for a coverage report. `tests/unit/openapi-contract.test.ts` additionally validates the generated OpenAPI document itself (every `$ref` resolves, every operation is documented and secured correctly) — a real bug class (malformed response docs) this test has already caught.

**Load/stress testing**: `npm run load-test` (`backend/scripts/load-test.ts`, via `autocannon`) hammers a running instance and reports throughput/latency, failing if the error rate is too high. A failure here can mean the rate limiter is correctly protecting an endpoint under synthetic load rather than a real bug — check whether failures are `429`s (limiter working as designed) or `5xx` (an actual problem) before concluding anything's broken.

## Continuous integration

`.github/workflows/ci.yml` runs on every push/PR to `main`: install, type check, lint, unit tests, integration tests, coverage, build, and a Docker build for both apps. All of it mirrors the commands in this guide — anything that fails in CI can be reproduced locally with the same command.

## Monitoring in development

`GET /metrics` (Prometheus format) and structured JSON request logs (Pino, one line per request with a `requestId` you can grep for) are on by default — see [security](../security/README.md#transport--headers) and [architecture](../architecture/BACKEND_ARCHITECTURE.md).

## Conventions

- TypeScript strict mode everywhere; no `any` without a documented reason.
- Backend: no code duplication across services — shared logic lives in `backend/src/utils/`; every mutating action gets an audit-log entry.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, …) — see recent `git log`.
