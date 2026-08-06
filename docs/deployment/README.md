# Deployment

KeepXtra ships as two independently deployable apps — a static frontend and a Node.js API — sharing no runtime dependency on each other beyond the `CORS_ORIGIN`-style configuration linking them.

For step-by-step instructions on a specific platform, see:

- [Docker](docker.md) — local full stack and self-hosted production
- [Render](render.md)
- [Railway](railway.md)
- [DigitalOcean](digitalocean.md)
- [AWS EC2](aws-ec2.md)

This page covers what's true regardless of platform.

## Frontend

The frontend (`frontend/`) is a static Vite/React build — deployable to any static host or CDN (Vercel, Netlify, S3+CloudFront, etc.), or containerized (see [docker.md](docker.md)).

```bash
cd frontend
npm install
npm run build      # type-checks (tsc -b) then builds to frontend/dist/
```

Serve `frontend/dist/` as static files. Because it's a single-page app with client-side routing, configure the host to rewrite unknown paths to `/index.html` (already handled for you in `frontend/nginx.conf` if using the provided Docker image).

## Backend

The backend (`backend/`) is a standard Node.js/Express service — deployable to any Node host, or containerized via `backend/Dockerfile`.

```bash
cd backend
npm install
npm run build       # compiles TypeScript to backend/dist/
npm run migrate     # applies any pending database migrations
npm run seed        # first deploy only — see below
npm start           # node dist/server.js
```

Set every variable for the target environment — see [Environment variables](#environment-variables) below and [security](../security/README.md) for what each secret protects. The process listens on `PORT` (default `4000`) and expects a reachable MongoDB instance at `MONGODB_URI`.

A production process manager (PM2, systemd, the host's own supervisor, or Docker's own restart policy) should restart the process on crash — `src/server.ts` already exits non-zero on unrecoverable startup failure (e.g. exhausted DB connection retries) so a supervisor can act on it, and handles `SIGTERM`/`SIGINT` for graceful shutdown.

### First deploy: seeding

A brand-new database has no permissions, roles, or users. `npm run seed` (see `backend/scripts/seed.ts`) creates the permission catalogue and role definitions from `src/constants/{permissions,roles}.ts`, and — if `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` are set — the first Super Admin login. It's idempotent; safe to run on every deploy.

### Database migrations

`npm run migrate` (see `backend/scripts/migrate.ts` and `src/migrations/`) applies any not-yet-applied migration and records it, so re-running is always safe. Run this as a release step before starting new application instances. See [database](../database/README.md#migrations).

## Containerization

Both apps have a `Dockerfile`. `docker-compose.yml` at the repo root spins up the full local dev stack (backend + MongoDB + Redis) with zero configuration; `docker-compose.prod.yml` builds the real production image against a real env file. See [docker.md](docker.md) for the full walkthrough.

## Environment variables

| App | Files | Notes |
|---|---|---|
| Backend | `backend/.env.example`, `.env.staging.example`, `.env.production.example`, `.env.test.example` | Copy the one matching your target to a real (untracked) file and fill in real values — see [security](../security/README.md) |
| Frontend | `frontend/.env.example` | `VITE_API_URL` (optional, defaults to `http://localhost:4000/api/v1`) — used by `authService.ts`. `farmerService`/`adminService` still run against an in-memory mock layer — see the note below |

`NODE_ENV` selects which environment the backend believes it's running as (`development` \| `test` \| `staging` \| `production`). In `staging`/`production`, `src/config/env.ts` additionally **rejects startup** if any secret still looks like an unfilled example value, if `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` are identical, or if `CORS_ORIGIN` still points at `localhost` — a deploy with an unedited example file fails fast instead of running insecurely.

## Frontend/backend integration status

`frontend/src/services/authService.ts` now calls the real backend (login, logout, session restore via silent refresh) — set `VITE_API_URL` if the backend isn't at the default `http://localhost:4000/api/v1`, and ensure the backend's `CORS_ORIGIN` includes the frontend's real origin (credentialed cookies require an exact match, not a wildcard). `farmerService.ts`/`adminService.ts` still serve every other screen from an in-memory mock data layer (`simulateRequest`/`simulateMutation`). The backend's REST API (documented in [api](../api/README.md)) is designed as a drop-in replacement for those two service modules' function signatures too, so connecting them is the same pattern `authService.ts` already demonstrates — swapping each mock function's body for a real HTTP call, not a redesign.

## Health checks

- `GET /health` — liveness only, never touches the database. Point a load balancer's health check here.
- `GET /health/ready` — readiness; 503 until MongoDB is connected. Use this for "don't route traffic here yet" checks (e.g. during a rolling restart).
- `GET /metrics` — Prometheus-format metrics. Restrict this to your scraper's network in production; it's unauthenticated by Prometheus convention (see [security](../security/README.md)).
