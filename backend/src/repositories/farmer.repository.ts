import { BaseRepository } from './base.repository'
import { Farmer, type IFarmer } from '../models/farmer.model'

export class FarmerRepository extends BaseRepository<IFarmer> {
  constructor() {
    super(Farmer)
  }

  async findByUserId(userId: string): Promise<IFarmer | null> {
    return this.findOne({ userId })
  }

  /** Matches on phone OR email — used at registration time to catch an accidental duplicate before it's created. */
  async findPotentialDuplicate(phone: string, email: string): Promise<IFarmer | null> {
    return this.model
      .findOne({ isDeleted: false, $or: [{ phone }, { email: email.toLowerCase().trim() }] })
      .exec()
  }

  /** `findById` excludes soft-deleted records by design — restore needs to find one specifically. */
  async findDeletedById(id: string): Promise<IFarmer | null> {
    return this.model.findOne({ _id: id, isDeleted: true }).exec()
  }

  async restoreById(id: string): Promise<IFarmer | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: true }, { $set: { isDeleted: false, deletedAt: null } }, { returnDocument: 'after' })
      .exec()
  }
}

export const farmerRepository = new FarmerRepository()
