# Operations Handbook

Day-to-day operational procedures for running the KeepXtra backend in a real environment.

## Routine tasks

### Deploying a new version

1. CI (`.github/workflows/ci.yml`) must be green on the commit being deployed — it already runs everything below.
2. Build: `npm run build` (or the Docker image build).
3. Run migrations **before** starting new instances on the new version: `npm run migrate`.
4. Start the new instance(s); once `GET /health/ready` returns 200, route traffic to them (rolling deploy) or cut over (blue/green).
5. Stop the old instance(s) — `src/server.ts` handles `SIGTERM` gracefully (stops accepting new connections, finishes in-flight requests, then exits).

### First deploy to a new environment

```bash
npm run seed   # permissions, roles, and (if SEED_ADMIN_EMAIL/PASSWORD set) the first Super Admin login
```

See [database](../database/README.md#seeding).

### Rotating a secret (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`)

Rotating `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` invalidates every currently-issued token the moment the new instances take over — every logged-in user is signed out. Prefer doing this during a low-traffic window and communicate it if the user base is large. There is no dual-secret grace period built in today; adding one (accepting either the old or new secret for a transition window) is a reasonable enhancement if zero-downtime rotation becomes a requirement.

### Backups

Schedule `npm run backup` (wraps `mongodump`) on a cron outside the app process — e.g. daily via the host's own scheduler, or your platform's managed-database backup feature if using MongoDB Atlas (preferred — continuous backup / point-in-time recovery beats a nightly dump). See [database](../database/README.md#backups). Verify restores periodically in a non-production environment; a backup nobody has ever restored is unverified.

### Unlocking a user account

An account locked by the brute-force guard (`docs/security.md#brute-force-protection`) clears itself automatically after `LOGIN_LOCKOUT_MINUTES`. To unlock it immediately (a legitimate support request), clear the lock directly:

```js
db.users.updateOne({ email: "user@example.com" }, { $set: { failedLoginAttempts: 0, lockedUntil: null } })
```

Every lock/unlock-relevant login attempt is in the `auditlogs` collection (`entityType: "User"`) if you need to confirm what actually happened before unlocking.

## Monitoring

- **Logs**: structured JSON via Pino, one line per request, includes a `requestId` — grep production logs by that ID to trace a single request end to end (the same ID is echoed in the client-facing error response and the `X-Request-Id` response header).
- **Metrics**: `GET /metrics` (Prometheus format) — point a Prometheus scrape config at it, restricted to your internal network. `http_requests_total` and `http_request_duration_seconds` are labeled by route *pattern* (never raw IDs) to keep cardinality bounded.
- **Slow queries**: any MongoDB command over 200ms is logged as a warning (`"Slow MongoDB query"`) with the command name and duration — search logs for that message to find query performance regressions.
- **Health**: `GET /health` (liveness) and `GET /health/ready` (readiness, checks DB connectivity) — see [deployment](../deployment/README.md#health-checks).

## Incident response

1. **Check `/health/ready`** first — if it's 503, the database is the problem, not the app.
2. **Check recent deploys** — most incidents follow a deploy. Roll back if the timing lines up and the fix isn't obvious.
3. **Check logs for the affected `requestId`(s)** if the report includes one (client-visible in the error response).
4. **Check `/metrics`** for an error-rate or latency spike, and correlate its start time with recent deploys/traffic changes.
5. Anything that reaches an unhandled `500` is logged at `error` level with a full stack trace and routed through `reportError()` (`src/utils/errorTracking.ts`) — currently a no-op hook, ready for a real error tracker (Sentry etc.) to be wired in without touching any call site.

## Scaling

- The backend is stateless (no in-process session state — auth is JWT + a DB-backed refresh token) and safe to run as multiple instances behind a load balancer.
- Rate limiting and caching are correct across multiple instances **only** when `REDIS_URL` is configured — without it, each instance enforces its own independent in-memory limit/cache, which still works but isn't a single coherent limit/cache across the fleet.
- Raise `MONGODB_MAX_POOL_SIZE` if you see connection-pool exhaustion under load (visible as elevated request latency and, in extreme cases, connection timeout errors in the logs).
