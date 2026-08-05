import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { AccessTokenPayload } from '../interfaces/auth.interface'

/**
 * Thin wrapper around jsonwebtoken for signing/verifying access tokens.
 * Every call stamps a fresh `jti` — without it, two tokens signed for the
 * same user within the same second (e.g. login immediately followed by a
 * refresh) would be byte-for-byte identical, since `{sub, tokenVersion,
 * iat, exp}` alone has no other source of uniqueness at second resolution.
 */
export function signAccessToken(payload: Omit<AccessTokenPayload, 'jti'>): string {
  return jwt.sign({ ...payload, jti: randomUUID() }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}

/** Reads the `exp` claim off an already-signed token, in epoch milliseconds — for the login/refresh response body. */
export function getTokenExpiryMs(token: string): number {
  const decoded = jwt.decode(token) as { exp?: number } | null
  if (!decoded?.exp) throw new Error('Token has no exp claim')
  return decoded.exp * 1000
}
