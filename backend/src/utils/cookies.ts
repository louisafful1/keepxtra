import type { Response } from 'express'
import { env, isProduction } from '../config/env'
import { REFRESH_COOKIE_NAME } from '../constants/auth'

/**
 * The refresh token cookie is intentionally scoped to `/auth` — it's never
 * sent on ordinary API calls (those use the Authorization header instead),
 * which keeps the one credential that travels ambiently as narrow as
 * possible. `secure` follows the environment so local HTTP development
 * still works; `sameSite: 'strict'` is safe here because the frontend and
 * API share a registrable domain in every deployment target.
 */
function cookieOptions(maxAgeMs?: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    path: `${env.API_PREFIX}/auth`,
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  }
}

export function setRefreshTokenCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie(REFRESH_COOKIE_NAME, token, cookieOptions(maxAgeMs))
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions())
}
