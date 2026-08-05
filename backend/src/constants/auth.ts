/** Auth-module tuning constants — the only place these numbers should live. */

export const BCRYPT_SALT_ROUNDS = 12

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
export const REFRESH_TOKEN_TTL_REMEMBER_ME_FALSE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export const REFRESH_COOKIE_NAME = 'keepxtra_refresh_token'

/** Minimum acceptable password length — mirrors the Zod validator, kept here so both agree on one number. */
export const MIN_PASSWORD_LENGTH = 8
