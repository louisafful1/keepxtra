# Deploying to DigitalOcean

Two reasonable paths: **App Platform** (managed PaaS, closest to Render/Railway) or a plain **Droplet** running `docker-compose.prod.yml` yourself. DigitalOcean also offers Managed MongoDB and Managed Redis/Valkey if you'd rather not self-host either.

## Option A — App Platform

1. **Create → Apps**, connect the GitHub repo.
2. Add a component for the backend: **Source Directory** `backend`, **Dockerfile path** `backend/Dockerfile` (App Platform auto-detects it). Set **HTTP Port** to `4000` and **Health Check Path** to `/health`.
3. Add every variable from `backend/.env.production.example` under that component's **Environment Variables** (mark secrets as encrypted).
4. Add a second component for the frontend as a **Static Site**: **Source Directory** `frontend`, **Build Command** `npm run build`, **Output Directory** `dist`. App Platform's static-site hosting handles SPA fallback routing automatically.
5. If using DigitalOcean Managed MongoDB/Redis, create them under **Databases**, then copy their connection strings into `MONGODB_URI`/`REDIS_URL` on the backend component (DO's managed MongoDB typically requires trusted-source IP allow-listing — add the App Platform component's outbound IPs).
6. Deploy, then run the one-time setup via the **Console** tab on the backend component:
   ```bash
   npm run migrate
   npm run seed
   ```

## Option B — Droplet (self-hosted Docker Compose)

1. Create a Droplet (Ubuntu LTS is a safe default), then install Docker + the Compose plugin:
   ```bash
   curl -fsSL https://get.docker.com | sh
   apt-get install -y docker-compose-plugin
   ```
2. Clone the repo onto the droplet, `cd` into it.
3. `cp backend/.env.production.example backend/.env.production` and fill in real values.
4. `docker compose -f docker-compose.prod.yml up --build -d` — this also runs `mongo`/`redis` as containers on the droplet itself (fine for a small/medium single-box deployment; use Managed MongoDB/Redis instead for anything that needs to scale beyond one box).
5. Put nginx or Caddy in front for TLS (`certbot`/Caddy's automatic HTTPS both work well here) — neither compose file terminates TLS on its own.
6. Run the one-time setup: `docker compose -f docker-compose.prod.yml exec backend npm run migrate && npm run seed`.
7. Open the firewall for `80`/`443` only (`ufw allow 80,443/tcp`); keep `4000`/`27017`/`6379` closed to the public internet — the reverse proxy is the only thing that should reach the backend port directly.

## Notes

- App Platform is the lower-maintenance option (managed TLS, managed scaling, managed restarts); a Droplet gives full control at the cost of being fully responsible for OS patching, TLS renewal, and monitoring yourself.
- Either way, back up via `npm run backup` (Droplet: run it directly or via a host cron; App Platform: prefer DO's Managed MongoDB automatic backups instead — see [database](../database/README.md#backups)).
