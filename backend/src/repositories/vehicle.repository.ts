import { BaseRepository } from './base.repository'
import { Vehicle, type IVehicle } from '../models/vehicle.model'

export class VehicleRepository extends BaseRepository<IVehicle> {
  constructor() {
    super(Vehicle)
  }

  async findDeletedById(id: string): Promise<IVehicle | null> {
    return this.model.findOne({ _id: id, isDeleted: true }).exec()
  }

  async restoreById(id: string): Promise<IVehicle | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: true }, { $set: { isDeleted: false, deletedAt: null } }, { returnDocument: 'after' })
      .exec()
  }

  /** Every non-deleted vehicle, for the fleet stats summary — small enough to aggregate in memory. */
  async findAllActive(): Promise<IVehicle[]> {
    return this.findMany({})
  }
}

export const vehicleRepository = new VehicleRepository()
