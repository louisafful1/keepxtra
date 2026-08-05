import { randomBytes, createHash } from 'node:crypto'

/**
 * Opaque, high-entropy tokens for refresh/password-reset/email-verification
 * links. These are never JWTs — they're random values the server looks up
 * by their SHA-256 hash, so a database leak alone never yields a usable
 * token (the raw value only ever exists in the response/cookie/email).
 */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}
