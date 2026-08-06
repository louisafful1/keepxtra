# Deploying to Railway

Railway can host MongoDB and Redis as one-click templates in the same project as the app, or you can point at external managed services (Atlas, etc.) instead — either works with `MONGODB_URI`/`REDIS_URL`.

## Backend

1. **New Project → Deploy from GitHub repo**, select this repo.
2. Railway auto-detects `backend/Dockerfile` if you set the service's **Root Directory** to `backend`; otherwise add a `railway.toml`/`railway.json` pointing `build.builder` at `DOCKERFILE` with `dockerfilePath = "backend/Dockerfile"` and `build.buildCommand`/`root` accordingly.
3. **Variables** tab: add every variable from `backend/.env.production.example` with real values. Railway injects its own `PORT` — the app already reads `PORT` from the environment, so this works without extra configuration.
4. **Settings → Healthcheck Path**: `/health`.
5. Optional: **+ New → Database → Add MongoDB** and **+ New → Database → Add Redis** in the same project — Railway exposes each as environment variable references (e.g. `${{MongoDB.MONGO_URL}}`) you can wire into the backend service's `MONGODB_URI`/`REDIS_URL` instead of hardcoding a connection string.
6. Deploy, then run the one-time setup via the Railway CLI or the service's shell:
   ```bash
   railway run npm run migrate
   railway run npm run seed
   ```

## Frontend

1. Add a second service from the same repo, **Root Directory**: `frontend`.
2. Either deploy it via `frontend/Dockerfile` (nginx, same as [docker.md](docker.md)), or use **Build Command** `npm run build` with a static-file serving buildpack if preferred.
3. Set `CORS_ORIGIN` on the backend service to this frontend's generated Railway domain (or your custom domain once attached).

## Notes

- Railway generates a public `*.up.railway.app` domain automatically per service; attach a custom domain under **Settings → Domains** once ready.
- Every service in a Railway project can reference another service's variables directly (`${{ServiceName.VAR}}`) — useful for wiring the frontend's API base URL to the backend service's public domain without hardcoding it.
