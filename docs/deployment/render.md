# Deploying to Render

Render doesn't offer a managed MongoDB — use MongoDB Atlas (or another managed provider) for `MONGODB_URI`. Render does offer managed Redis (Key Value) if you want `REDIS_URL` on Render too.

## Backend

1. **New → Web Service**, connect the GitHub repo.
2. **Root Directory**: `backend`.
3. **Runtime**: Docker (Render detects `backend/Dockerfile` automatically) — or, without Docker, set **Build Command** to `npm install && npm run build` and **Start Command** to `npm start`.
4. **Health Check Path**: `/health`.
5. **Environment**: add every variable from `backend/.env.production.example`, with real values. Set `NODE_ENV=production`, `PORT=4000` (Render sets its own `PORT` and expects the app to bind to it — since the app already reads `PORT` from the environment, this works automatically), and `CORS_ORIGIN` to your deployed frontend's real URL.
6. Deploy. Once live, run the one-time setup from the **Shell** tab (or a Render **Job**):
   ```bash
   npm run migrate
   npm run seed
   ```
7. Auto-deploy on push to `main` is on by default — CI (`.github/workflows/ci.yml`) should gate merges to `main` so only green commits reach this point.

## Frontend

1. **New → Static Site**, same repo.
2. **Root Directory**: `frontend`.
3. **Build Command**: `npm install && npm run build`.
4. **Publish Directory**: `dist`.
5. Add a rewrite rule so client-side routes resolve: `/*` → `/index.html` (Render's Static Site settings has a dedicated "Redirects/Rewrites" section for this).

## Notes

- Render's free/starter tiers spin down on inactivity — the first request after idle will be slow (cold start) and may time out a health check retry; a paid always-on plan avoids this for a real deployment.
- Set up a Render **Environment Group** if you want to share the same variable set across a staging and production service without duplicating entries.
