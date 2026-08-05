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

  /** Hydrates the role + its permission documents — what `authenticate` needs to populate `req.user`. */
  async findByIdWithRole(id: string): Promise<IUser | null> {
    return this.model
      .findOne({ _id: id, isDeleted: false })
      .populate({ path: 'roleId', populate: { path: 'permissions' } })
      .exec()
  }
}

export const userRepository = new UserRepository()
