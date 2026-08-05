import { EmailVerificationToken, type IEmailVerificationToken } from '../models/emailVerificationToken.model'

export class EmailVerificationTokenRepository {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<IEmailVerificationToken> {
    return EmailVerificationToken.create({ userId, tokenHash, expiresAt })
  }

  async findValidByTokenHash(tokenHash: string): Promise<IEmailVerificationToken | null> {
    return EmailVerificationToken.findOne({ tokenHash, usedAt: null, expiresAt: { $gt: new Date() } }).exec()
  }

  async markUsed(id: string): Promise<void> {
    await EmailVerificationToken.updateOne({ _id: id }, { $set: { usedAt: new Date() } }).exec()
  }
}

export const emailVerificationTokenRepository = new EmailVerificationTokenRepository()
