import { BaseRepository } from './base.repository'
import { Pickup, type IPickup } from '../models/pickup.model'

export class PickupRepository extends BaseRepository<IPickup> {
  constructor() {
    super(Pickup)
  }

  async findByStorageRequestId(storageRequestId: string): Promise<IPickup | null> {
    return this.findOne({ storageRequestId })
  }
}

export const pickupRepository = new PickupRepository()
