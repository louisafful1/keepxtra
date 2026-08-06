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

```bash
# Backend
cd backend
npm install
cp .env.example .env   # then fill in real values — see docs/security
npm run dev             # tsx watch src/server.ts, http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev              # vite, http://localhost:5173
```

## Common commands

| Command | Frontend | Backend |
|---|---|---|
| Dev server | `npm run dev` | `npm run dev` |
| Type check | `npm run build` (runs `tsc -b`) | `npm run typecheck` |
| Lint | `npm run lint` (oxlint) | `npm run lint` (ESLint) |
| Test | — | `npm test` (Vitest) / `npm run test:coverage` |
| Production build | `npm run build` | `npm run build` |

## Backend architecture

The backend follows a strict layered architecture — see [docs/architecture](../architecture/BACKEND_ARCHITECTURE.md) for the full design:

```
Routes → Validators (Zod) → Controllers (thin) → Services (business logic) → Repositories (DB access) → Mongoose Models
```

Cross-cutting concerns (RBAC permission checks, audit logging, event-driven auto-creation between modules) are documented per-module in that same file.

## Testing

Backend tests run against a disposable in-memory MongoDB instance (`mongodb-memory-server`) — no real database needed. See `backend/tests/setup.ts`. Run `npm test` from `backend/` for the full suite, or `npm run test:coverage` for a coverage report.

## Conventions

- TypeScript strict mode everywhere; no `any` without a documented reason.
- Backend: no code duplication across services — shared logic lives in `backend/src/utils/`; every mutating action gets an audit-log entry.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, …) — see recent `git log`.
