import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { AccessTokenPayload } from '../interfaces/auth.interface'

/**
 * Thin wrapper around jsonwebtoken for access tokens. This is infrastructure
 * only — no login/refresh flow calls `signAccessToken` yet, but the
 * `authenticate` middleware depends on `verifyAccessToken` today so it can
 * be wired to real routes the moment the auth module ships.
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}
