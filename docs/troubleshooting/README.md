# Troubleshooting

## Startup

**"Invalid or missing environment variables" and the process exits immediately**
`src/config/env.ts` validates every variable at boot and refuses to start on a failure — the error lists exactly which variable(s) and why. Check that file against the right `.env.*.example` for your environment (see [deployment](../deployment/README.md#environment-variables)).

**Starts fine in development but refuses to start in staging/production**
This is almost always the production hardening check in `env.ts`: a secret still looks like an example placeholder, `JWT_ACCESS_SECRET` equals `JWT_REFRESH_SECRET`, or `CORS_ORIGIN` still points at `localhost`. The error message names the exact field. See [security](../security/README.md#secrets).

**"MongoDB connection attempt failed" repeated 5 times, then exits**
The app retries with backoff, then gives up — check `MONGODB_URI` is reachable from wherever the process is running (network/firewall/IP allow-list, for Atlas), and that the credentials in the URI are correct.

## Requests

**Every request returns 401**
Check the `Authorization: Bearer <token>` header is present and the token hasn't expired (`JWT_ACCESS_EXPIRES_IN`, default 15m) — the frontend is expected to transparently refresh via `POST /api/v1/auth/refresh` using the httpOnly cookie. A `tokenVersion` mismatch (from a password change/reset since the token was issued) also produces a 401 asking to log in again.

**429 Too Many Requests**
Rate limiting — see [security](../security/README.md#rate-limiting). Check the `RateLimit-*` response headers for the current limit/remaining/reset. If this fires legitimately in normal use, raise `RATE_LIMIT_MAX_REQUESTS`/`AUTH_RATE_LIMIT_MAX_REQUESTS`, not disable it.

**403 "Too many failed login attempts" for a real user**
Account lockout, not a permissions problem — see [operations](../operations/README.md#unlocking-a-user-account) to clear it.

**403 "Missing required permission(s): x.y"**
The user's role doesn't grant that permission — check `constants/roles.ts` against what the user's actual role in the database has (roles are seeded from that file via `npm run seed`, but an existing deployment's roles only pick up changes to that file on the next `npm run seed` run).

**CORS errors in the browser console**
`CORS_ORIGIN` doesn't include the origin the frontend is actually served from. It's a comma-separated list — add the missing origin and restart.

## Testing

**A specific test file fails only when running the full suite, but passes in isolation**
This is a known characteristic of this suite on resource-constrained machines, not a real bug in the code under test — MongoDB memory-server instances and Vitest's parallel workers are memory/CPU-heavy, and a machine under enough pressure will see transient failures (`ECONNRESET`, "Zone Allocation failed - process out of memory", worker crashes) in essentially random files. Confirm by re-running just the failed file(s) — if they pass alone, it was resource contention, not a regression.

**"available disk space of ... is less than required minimum of 524288000"**
mongodb-memory-server refuses to start a new instance below ~500MB free disk. Each test run's temp MongoDB data directory (`%TEMP%/mongo-mem-*` on Windows, `/tmp/mongo-mem-*` elsewhere) is normally cleaned up when the test process exits cleanly — but a crashed/killed worker (e.g. from the OOM issue above) leaves its data directory behind. These accumulate over many runs and are always safe to delete:

```bash
rm -rf /tmp/mongo-mem-*                              # Linux/macOS
rm -rf "$TEMP/mongo-mem-*"                             # Windows (Git Bash)
```

**Vitest hangs or a mongod process "didn't exit"**
Usually a symptom of the same resource exhaustion above — free disk/memory first, then re-run.

## Docker

**`docker compose up` fails on the `backend` service with a module-not-found error**
The dev `docker-compose.yml` bind-mounts `./backend:/app` over an anonymous `backend_node_modules` volume specifically so the container's own `npm ci`-installed `node_modules` isn't shadowed by the host's. If you changed dependencies, rebuild: `docker compose up --build`.

**Healthcheck never turns healthy**
`docker compose ps` shows the healthcheck status; `docker compose logs backend` shows why the app itself isn't responding on `/health` — most commonly a database connection failure (check `mongo`'s own healthcheck/logs first, since `backend` depends on `service_healthy` for both `mongo` and `redis`).

## Reports & exports

**A report's `?format=csv`/`?format=pdf` download is empty or missing rows**
Every report's JSON (`?format=json`, the default) and its CSV/PDF export are generated from the exact same underlying data (`ReportResult.rows` in `report.service.ts`) — if the JSON response also looks wrong, the bug is in the report query, not the export format. Compare the JSON first to isolate which layer is actually wrong.
