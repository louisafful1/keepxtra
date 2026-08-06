# Security

## Authentication

- **Passwords** are hashed with `bcrypt` (`backend/src/utils/password.ts`) — never stored or logged in plaintext.
- **Access tokens** are short-lived JWTs (`JWT_ACCESS_EXPIRES_IN`, default 15m), signed with `JWT_ACCESS_SECRET`, sent as a `Bearer` token in the `Authorization` header.
- **Refresh tokens** are longer-lived (`JWT_REFRESH_EXPIRES_IN`, default 30d), signed with a separate `JWT_REFRESH_SECRET`, issued as an httpOnly cookie, and tracked server-side (`RefreshToken` collection) so a token can be revoked/rotated.
- **`tokenVersion`** on `User` is bumped on password change/reset, immediately invalidating every previously-issued access token for that user.
- Email verification and password-reset flows use single-use, short-lived tokens (`EmailVerificationToken`, `PasswordResetToken`).

## Authorization (RBAC)

- Every operations user has a `Role`, and every `Role` grants a set of `Permission` keys (or `'*'` for Super Admin) — see `backend/src/constants/permissions.ts` and `backend/src/constants/roles.ts`.
- Every mutating endpoint is gated with `requirePermission('<permission.key>')` (`backend/src/middlewares/requirePermission.ts`) — permissions are never hardcoded per-role in a controller.
- Self-scoped resources (e.g. a user's own notifications) are additionally checked for ownership in the service layer, independent of the permission check.

## Audit trail

Every state-changing action across every module writes an `AuditLog` entry (`backend/src/services/audit.service.ts`) — actor, action, entity, previous/new value, IP, timestamp. Soft-deletes preserve history rather than destroying records — see [database](../database/README.md).

## Transport & headers

- `helmet()` for standard security headers.
- CORS restricted to `CORS_ORIGIN` (comma-separated allow-list) with credentials enabled for the cookie-based refresh flow.
- Express `trust proxy` enabled for correct `req.ip`/`req.secure` behind a load balancer.
- Request bodies capped at 1MB.

## Secrets

`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `COOKIE_SECRET` must each be a long, random value in every real environment — see `backend/.env.example`. **Never commit a populated `.env` file**; `backend/.env` is git-ignored for exactly this reason.
