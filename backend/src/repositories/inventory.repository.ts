import { BaseRepository } from './base.repository'
import { Inventory, type IInventory } from '../models/inventory.model'

export class InventoryRepository extends BaseRepository<IInventory> {
  constructor() {
    super(Inventory)
  }

  async findByPickupId(pickupId: string): Promise<IInventory | null> {
    return this.findOne({ pickupId })
  }

  /** Every non-deleted inventory record, for the intelligence summary — small enough to sum/filter in memory rather than an aggregation pipeline. */
  async findAllActive(): Promise<IInventory[]> {
    return this.findMany({})
  }
}

export const inventoryRepository = new InventoryRepository()
