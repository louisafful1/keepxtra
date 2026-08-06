import { BaseRepository } from './base.repository'
import { Driver, type IDriver } from '../models/driver.model'

export class DriverRepository extends BaseRepository<IDriver> {
  constructor() {
    super(Driver)
  }

  async findDeletedById(id: string): Promise<IDriver | null> {
    return this.model.findOne({ _id: id, isDeleted: true }).exec()
  }

  async restoreById(id: string): Promise<IDriver | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: true }, { $set: { isDeleted: false, deletedAt: null } }, { returnDocument: 'after' })
      .exec()
  }
}

export const driverRepository = new DriverRepository()
