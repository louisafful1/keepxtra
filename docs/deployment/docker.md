# Deploying with Docker

Both apps ship a `Dockerfile`; the repo root has two Compose files — `docker-compose.yml` for local development, `docker-compose.prod.yml` for a self-hosted production stack.

## Local development

```bash
docker compose up --build
```

Starts `backend` (hot-reload via `tsx watch`, source bind-mounted), `mongo`, and `redis`, wired together with health-check-gated startup ordering. Every value in `docker-compose.yml`'s `environment:` block is a non-secret local default — no `.env` file needed to get started. The API is at `http://localhost:4000`; run the frontend separately with `cd frontend && npm run dev`.

Tear down with `docker compose down`; add `-v` to also delete the `mongo_data`/`redis_data` volumes (destroys local data).

## Self-hosted production

```bash
cp backend/.env.production.example backend/.env.production
# edit backend/.env.production with real secrets/URIs — see docs/security

docker compose -f docker-compose.prod.yml up --build -d

# first deploy only:
docker compose -f docker-compose.prod.yml exec backend npm run migrate
docker compose -f docker-compose.prod.yml exec backend npm run seed
```

`docker-compose.prod.yml` builds the real multi-stage image (`runtime` target — no dev dependencies, no source bind-mount), sets `restart: unless-stopped`, caps resources (1 CPU / 512MB by default — adjust in the file for your box), and rotates JSON logs. It includes `mongo`/`redis` services for a fully self-hosted setup; **for a real production deployment, prefer managed MongoDB (Atlas) and Redis (Redis Cloud/Elasticache/etc.) instead** — point `MONGODB_URI`/`REDIS_URL` at those and remove the `mongo`/`redis` services and their `depends_on` entries.

Put a reverse proxy (nginx, Caddy, Traefik) in front for TLS termination — neither compose file terminates TLS itself.

## Building images standalone (for a registry, Kubernetes, etc.)

```bash
docker build -t your-registry/keepxtra-backend:latest ./backend
docker build -t your-registry/keepxtra-frontend:latest ./frontend
docker push your-registry/keepxtra-backend:latest
docker push your-registry/keepxtra-frontend:latest
```

The backend image needs every variable in `backend/.env.production.example` supplied at runtime (via your orchestrator's secret/env mechanism, not baked into the image). It listens on `4000` and exposes `GET /health` for liveness and `GET /health/ready` for readiness probes. The frontend image is nginx serving the static build on port `80`, with client-side routing already handled by `frontend/nginx.conf` — no extra configuration needed.
