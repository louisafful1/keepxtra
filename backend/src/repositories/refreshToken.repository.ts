import { RefreshToken, type IRefreshToken } from '../models/refreshToken.model'

/**
 * Refresh tokens are append-only/short-lived (TTL-purged) — no soft delete,
 * so this doesn't extend `BaseRepository`. "Deleting" a token means
 * revoking it (`revokedAt`), never removing the row, so reuse detection
 * still has something to detect against.
 */
export class RefreshTokenRepository {
  async create(input: {
    userId: string
    tokenHash: string
    family: string
    expiresAt: Date
    userAgent?: string | null
    ip?: string | null
  }): Promise<IRefreshToken> {
    return RefreshToken.create(input)
  }

  async findByTokenHash(tokenHash: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ tokenHash }).exec()
  }

  async revokeByTokenHash(tokenHash: string, replacedByTokenHash?: string): Promise<void> {
    await RefreshToken.updateOne(
      { tokenHash },
      { $set: { revokedAt: new Date(), replacedByTokenHash: replacedByTokenHash ?? null } },
    ).exec()
  }

  /** Revokes every token in a rotation family — used on reuse detection (a stolen/replayed token was presented). */
  async revokeFamily(family: string): Promise<void> {
    await RefreshToken.updateMany({ family, revokedAt: null }, { $set: { revokedAt: new Date() } }).exec()
  }

  /** Revokes every active session for a user — used on password change/reset ("log out everywhere"). */
  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshToken.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } }).exec()
  }
}

export const refreshTokenRepository = new RefreshTokenRepository()
