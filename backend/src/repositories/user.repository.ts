import { BaseRepository } from './base.repository'
import { User, type IUser } from '../models/user.model'

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User)
  }

  /** Includes `passwordHash` (normally `select: false`) for credential verification. */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return this.model.findOne({ email: email.toLowerCase().trim(), isDeleted: false }).select('+passwordHash').exec()
  }

  /** Login needs both the password hash (to verify) and the hydrated role/permissions (for the response) in one round trip. */
  async findByEmailForLogin(email: string): Promise<IUser | null> {
    return this.model
      .findOne({ email: email.toLowerCase().trim(), isDeleted: false })
      .select('+passwordHash')
      .populate({ path: 'roleId', populate: { path: 'permissions' } })
      .exec()
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return this.model.findOne({ _id: id, isDeleted: false }).select('+passwordHash').exec()
  }

  /** Hydrates the role + its permission documents — what `authenticate` needs to populate `req.user`. */
  async findByIdWithRole(id: string): Promise<IUser | null> {
    return this.model
      .findOne({ _id: id, isDeleted: false })
      .populate({ path: 'roleId', populate: { path: 'permissions' } })
      .exec()
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase().trim() })
  }

  /** Sets a new password hash, records when it changed, and bumps `tokenVersion` — invalidating every access token issued before this call. */
  async setPassword(id: string, passwordHash: string): Promise<void> {
    await this.model
      .updateOne({ _id: id }, { $set: { passwordHash, passwordChangedAt: new Date() }, $inc: { tokenVersion: 1 } })
      .exec()
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { emailVerifiedAt: new Date() } }).exec()
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } }).exec()
  }

  /** Atomically bumps the bad-password counter and locks the account once it reaches `maxAttempts`. Returns the new count and whether this call is what tripped the lock. */
  async registerFailedLogin(id: string, maxAttempts: number, lockoutMinutes: number): Promise<{ count: number; justLocked: boolean }> {
    const updated = await this.model.findOneAndUpdate({ _id: id }, { $inc: { failedLoginAttempts: 1 } }, { returnDocument: 'after' }).exec()
    if (!updated) return { count: 0, justLocked: false }

    if (updated.failedLoginAttempts >= maxAttempts && !updated.lockedUntil) {
      const lockedUntil = new Date(Date.now() + lockoutMinutes * 60_000)
      await this.model.updateOne({ _id: id }, { $set: { lockedUntil } }).exec()
      return { count: updated.failedLoginAttempts, justLocked: true }
    }
    return { count: updated.failedLoginAttempts, justLocked: false }
  }

  /** Clears lockout state — called on a successful login and whenever an expired lock is encountered. */
  async resetLoginAttempts(id: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { failedLoginAttempts: 0, lockedUntil: null } }).exec()
  }
}

export const userRepository = new UserRepository()
