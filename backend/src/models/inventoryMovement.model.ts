import { Schema, model, type Document, type Types } from 'mongoose'

export type InventoryMovementType = 'Receipt' | 'Adjustment' | 'Transfer' | 'Disposal'

/**
 * The append-only ledger behind "Stock movement / Inventory history" — a
 * dedicated collection rather than an embedded array on Inventory, mirroring
 * why AuditLog is its own collection: an unbounded, ever-growing history
 * doesn't belong inside the record it describes. Never updated after
 * creation.
 */
export interface IInventoryMovement extends Document {
  inventoryId: Types.ObjectId
  type: InventoryMovementType
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  reason: string | null
  fromWarehouseId: Types.ObjectId | null
  toWarehouseId: Types.ObjectId | null
  performedBy: Types.ObjectId
  createdAt: Date
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    type: { type: String, enum: ['Receipt', 'Adjustment', 'Transfer', 'Disposal'], required: true },
    quantityChange: { type: Number, required: true },
    quantityBefore: { type: Number, required: true, min: 0 },
    quantityAfter: { type: Number, required: true, min: 0 },
    reason: { type: String, default: null },
    fromWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', default: null },
    toWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', default: null },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

inventoryMovementSchema.index({ inventoryId: 1, createdAt: -1 })

export const InventoryMovement = model<IInventoryMovement>('InventoryMovement', inventoryMovementSchema)
