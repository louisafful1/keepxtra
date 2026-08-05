import { PasswordResetToken, type IPasswordResetToken } from '../models/passwordResetToken.model'

export class PasswordResetTokenRepository {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<IPasswordResetToken> {
    return PasswordResetToken.create({ userId, tokenHash, expiresAt })
  }

  /** Only returns a token that hasn't been used or expired yet — callers don't need to re-check either. */
  async findValidByTokenHash(tokenHash: string): Promise<IPasswordResetToken | null> {
    return PasswordResetToken.findOne({ tokenHash, usedAt: null, expiresAt: { $gt: new Date() } }).exec()
  }

  async markUsed(id: string): Promise<void> {
    await PasswordResetToken.updateOne({ _id: id }, { $set: { usedAt: new Date() } }).exec()
  }
}

export const passwordResetTokenRepository = new PasswordResetTokenRepository()
