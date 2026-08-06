# Security

## Authentication

- **Passwords** are hashed with `bcrypt` (`backend/src/utils/password.ts`) — never stored or logged in plaintext.
- **Access tokens** are short-lived JWTs (`JWT_ACCESS_EXPIRES_IN`, default 15m), signed with `JWT_ACCESS_SECRET`, sent as a `Bearer` token in the `Authorization` header.
- **Refresh tokens** are longer-lived (`JWT_REFRESH_EXPIRES_IN`, default 30d), signed with a separate `JWT_REFRESH_SECRET`, issued as an httpOnly cookie, and tracked server-side (`RefreshToken` collection) so a token can be revoked/rotated. Reuse of an already-rotated token revokes its entire session family. Expired tokens are purged automatically by a MongoDB TTL index — no cleanup job needed.
- **`tokenVersion`** on `User` is bumped on password change/reset, immediately invalidating every previously-issued access token for that user.
- Email verification and password-reset flows use single-use, short-lived tokens (`EmailVerificationToken`, `PasswordResetToken`).

## Brute-force protection

- After `LOGIN_MAX_ATTEMPTS` (default 5) consecutive bad passwords, an account is locked for `LOGIN_LOCKOUT_MINUTES` (default 15) — further attempts, even with the correct password, are rejected with 403 until the lock expires. The counter resets on a successful login; an expired lock clears itself on the next attempt. See `User.failedLoginAttempts`/`lockedUntil` and `auth.service.ts#login`.
- Every login attempt against a real account — success, failure, lockout, or a blocked attempt against an already-locked account — writes an `AuditLog` entry (see below). An email that matches no account at all logs nothing to the audit trail (there's no real entity to attribute it to) but is still logged operationally.
- `GET/POST /api/v1/auth/*` carries its own, tighter rate limit (`AUTH_RATE_LIMIT_MAX_REQUESTS`, default 20 per `RATE_LIMIT_WINDOW_MINUTES`) on top of the global API limit — see below.

## Rate limiting

- Every `/api/v1/*` request is rate-limited (`RATE_LIMIT_MAX_REQUESTS` per `RATE_LIMIT_WINDOW_MINUTES`, default 300/15min); `/api/v1/auth/*` additionally carries the tighter `AUTH_RATE_LIMIT_MAX_REQUESTS` ceiling on top.
- Backed by Redis (`REDIS_URL`) when configured, so the limit is enforced consistently across every instance behind a load balancer; falls back to a per-process in-memory store when Redis isn't configured (fine for a single instance, not for a multi-instance deployment).
- A limited request gets `429` with `{ error: { code: 'RATE_LIMITED' } }` and standard `RateLimit-*` response headers.

## Authorization (RBAC)

- Every operations user has a `Role`, and every `Role` grants a set of `Permission` keys (or `'*'` for Super Admin) — see `backend/src/constants/permissions.ts` and `backend/src/constants/roles.ts`. `npm run seed` is what actually materializes this catalogue into the database.
- Every mutating endpoint is gated with `requirePermission('<permission.key>')` (`backend/src/middlewares/requirePermission.ts`) — permissions are never hardcoded per-role in a controller.
- Self-scoped resources (e.g. a user's own notifications) are additionally checked for ownership in the service layer, independent of the permission check.

## Input handling

- Every request body/query/params/response is JSON — the API never renders HTML, which is most of the practical XSS surface handled for free. The frontend (React) escapes on render by default; that remains the primary defense against a stored value being executed as script somewhere.
- **NoSQL injection**: `sanitizeRequest` (`backend/src/middlewares/sanitize.ts`) strips any object key starting with `$` or containing `.` from every request body/query/params — the two building blocks of a Mongo query-operator injection (e.g. `{ "email": { "$gt": "" } }` trying to bypass an equality check). It only ever touches keys, never string values, so legitimate free text is untouched.
- Every request body/query is additionally validated against a Zod schema (`validateRequest` middleware) before it reaches a controller — malformed input never reaches business logic.
- Request bodies are capped at 1MB.

## Audit trail

Every state-changing action across every module writes an `AuditLog` entry (`backend/src/services/audit.service.ts`) — actor, action, entity, previous/new value, IP, timestamp. Soft-deletes preserve history rather than destroying records — see [database](../database/README.md).

## Transport & headers

- `helmet()` for standard security headers.
- CORS restricted to `CORS_ORIGIN` (comma-separated allow-list) with credentials enabled for the cookie-based refresh flow.
- Express `trust proxy` enabled for correct `req.ip`/`req.secure` behind a load balancer.
- `GET /metrics` (Prometheus scrape target) is unauthenticated by Prometheus convention — restrict network access to it at the infrastructure level (firewall/security group) in any real deployment rather than exposing it publicly.

## Secrets

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `COOKIE_SECRET` must each be a long, random, unique value in every real environment — see `backend/.env.example`.
- **Never commit a populated `.env` file**; every `backend/.env*` variant except the `.example` ones is git-ignored for exactly this reason.
- In `staging`/`production`, startup validation (`src/config/env.ts`) actively refuses to boot if a secret still looks like an unfilled placeholder, if the access/refresh secrets are identical, or if `CORS_ORIGIN` still points at `localhost` — an unedited example file fails loudly instead of running insecurely.
