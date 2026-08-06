import { BaseRepository } from './base.repository'
import { Warehouse, type IWarehouse } from '../models/warehouse.model'

export class WarehouseRepository extends BaseRepository<IWarehouse> {
  constructor() {
    super(Warehouse)
  }

  /** `findById` excludes soft-deleted records by design — restore needs to find one specifically. */
  async findDeletedById(id: string): Promise<IWarehouse | null> {
    return this.model.findOne({ _id: id, isDeleted: true }).exec()
  }

  async restoreById(id: string): Promise<IWarehouse | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: true }, { $set: { isDeleted: false, deletedAt: null } }, { returnDocument: 'after' })
      .exec()
  }

  /** Every non-deleted warehouse, for the aggregate stats summary — small enough (dozens, not millions) to sum in memory rather than an aggregation pipeline. */
  async findAllActive(): Promise<IWarehouse[]> {
    return this.findMany({})
  }
}

export const warehouseRepository = new WarehouseRepository()
