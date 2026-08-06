import { InventoryMovement, type IInventoryMovement, type InventoryMovementType } from '../models/inventoryMovement.model'
import type { Types } from 'mongoose'

export interface CreateMovementInput {
  inventoryId: Types.ObjectId
  type: InventoryMovementType
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  reason?: string | null
  fromWarehouseId?: Types.ObjectId | null
  toWarehouseId?: Types.ObjectId | null
  performedBy: Types.ObjectId
}

/**
 * Not a `BaseRepository` subclass — movements are an append-only ledger
 * with no `isDeleted`/soft-delete concept (see the model's doc comment),
 * so the generic soft-delete-aware CRUD surface doesn't apply here.
 */
export class InventoryMovementRepository {
  async create(input: CreateMovementInput): Promise<IInventoryMovement> {
    return InventoryMovement.create(input)
  }

  async findByInventoryId(inventoryId: string, options: { skip: number; limit: number }): Promise<IInventoryMovement[]> {
    return InventoryMovement.find({ inventoryId }).sort({ createdAt: -1 }).skip(options.skip).limit(options.limit).exec()
  }

  async countByInventoryId(inventoryId: string): Promise<number> {
    return InventoryMovement.countDocuments({ inventoryId }).exec()
  }
}

export const inventoryMovementRepository = new InventoryMovementRepository()
