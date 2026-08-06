# Deployment

KeepXtra ships as two independently deployable apps — a static frontend and a Node.js API — sharing no runtime dependency on each other beyond the `CORS_ORIGIN`/`VITE_API_URL`-style configuration linking them.

## Frontend

The frontend (`frontend/`) is a static Vite/React build — deployable to any static host or CDN (Vercel, Netlify, S3+CloudFront, etc.).

```bash
cd frontend
npm install
npm run build      # type-checks (tsc -b) then builds to frontend/dist/
```

Serve `frontend/dist/` as static files. Because it's a single-page app with client-side routing, configure the host to rewrite unknown paths to `/index.html`.

## Backend

The backend (`backend/`) is a standard Node.js/Express service — deployable to any Node host (Render, Railway, Fly.io, a VM, ECS, etc.).

```bash
cd backend
npm install
npm run build       # compiles TypeScript to backend/dist/
npm start           # node dist/server.js
```

Set every variable in `backend/.env.example` (see the [security](../security/README.md) doc for the secrets). The process listens on `PORT` (default `4000`) and expects a reachable MongoDB instance at `MONGODB_URI`.

A production process manager (PM2, systemd, or the host's own supervisor) should restart the process on crash — `src/server.ts` already exits non-zero on unrecoverable startup failure (e.g. exhausted DB connection retries) so a supervisor can act on it, and handles `SIGTERM`/`SIGINT` for graceful shutdown.

## Containerization

No `Dockerfile`/`docker-compose.yml` ships yet — both apps run directly via `npm`. If containerizing, the frontend is a standard static-build-then-serve image (e.g. `node:lts` build stage → `nginx`/`caddy` runtime stage) and the backend is a standard `node:lts` runtime image running `npm run build && npm start`.

## Environment variables

| App | File | Notes |
|---|---|---|
| Backend | `backend/.env.example` | Copy to `backend/.env` and fill in real values — see [security](../security/README.md) |
| Frontend | — | No required env vars today; the frontend currently runs entirely against an in-memory mock service layer (`frontend/src/services/`), not the real backend — see the note below |

## Frontend/backend integration status

The frontend (`frontend/src/services/{auth,farmer,admin}Service.ts`) currently serves every screen from an in-memory mock data layer (`simulateRequest`/`simulateMutation`), not the real backend — the two apps are not yet wired together. The backend's REST API (documented in [api](../api/README.md)) is designed as a drop-in replacement for those three service modules' function signatures, so connecting them is a matter of swapping each mock function's body for a real HTTP call, not a redesign.

## Health checks

`GET /health` on the backend (unversioned, outside `/api/v1`) reports process and database connectivity — point your load balancer's health check here.
