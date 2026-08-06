import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'
import type { StorageRequestUnit } from './storageRequest.model'

export type InventoryStatus = 'Pending Placement' | 'In Stock' | 'Depleted' | 'Disposed'

/**
 * An Inventory record is always born from a completed Pickup — there is no
 * manual "create" endpoint, mirroring the Pickup module's own relationship
 * to Storage Request. It starts in `Pending Placement` (produce has been
 * collected but not yet assigned a physical warehouse/cold room); `receive`
 * moves it to `In Stock` and computes `expiryDate` from the harvest date +
 * the shelf life ops records at that point.
 *
 * `reservedQuantity` exists as a schema-level extension point for the
 * future Sales module (a later phase) to reserve stock against a pending
 * order — nothing in this phase ever sets it away from 0.
 */
export interface IInventory extends Document {
  inventoryCode: string
  pickupId: Types.ObjectId
  storageRequestId: Types.ObjectId
  requestNumber: string
  farmerId: Types.ObjectId
  farmerName: string
  farmerNumber: string

  produceType: string
  unit: StorageRequestUnit
  harvestDate: Date

  initialQuantity: number
  currentQuantity: number
  reservedQuantity: number

  warehouseId: Types.ObjectId | null
  warehouseCode: string | null
  warehouseName: string | null
  coldRoomId: Types.ObjectId | null
  coldRoomCode: string | null

  shelfLifeDays: number | null
  expiryDate: Date | null
  valuePerUnit: number | null

  status: InventoryStatus
  receivedAt: Date | null
  receivedBy: Types.ObjectId | null
  disposedAt: Date | null
  disposedBy: Types.ObjectId | null
  disposalReason: string | null

  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const inventorySchema = new Schema<IInventory>(
  {
    inventoryCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    pickupId: { type: Schema.Types.ObjectId, ref: 'Pickup', required: true, unique: true },
    storageRequestId: { type: Schema.Types.ObjectId, ref: 'StorageRequest', required: true },
    requestNumber: { type: String, required: true, trim: true, uppercase: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true },
    farmerName: { type: String, required: true, trim: true },
    farmerNumber: { type: String, required: true, trim: true, uppercase: true },

    produceType: { type: String, required: true, trim: true },
    unit: { type: String, enum: ['kg', 'tons', 'bags', 'crates'], required: true },
    harvestDate: { type: Date, required: true },

    initialQuantity: { type: Number, required: true, min: 0.01 },
    currentQuantity: { type: Number, required: true, min: 0 },
    reservedQuantity: { type: Number, required: true, min: 0, default: 0 },

    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', default: null },
    warehouseCode: { type: String, default: null, trim: true, uppercase: true },
    warehouseName: { type: String, default: null, trim: true },
    coldRoomId: { type: Schema.Types.ObjectId, ref: 'ColdRoom', default: null },
    coldRoomCode: { type: String, default: null, trim: true, uppercase: true },

    shelfLifeDays: { type: Number, default: null, min: 1 },
    expiryDate: { type: Date, default: null },
    valuePerUnit: { type: Number, default: null, min: 0 },

    status: { type: String, enum: ['Pending Placement', 'In Stock', 'Depleted', 'Disposed'], default: 'Pending Placement' },
    receivedAt: { type: Date, default: null },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    disposedAt: { type: Date, default: null },
    disposedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    disposalReason: { type: String, default: null },
  },
  { timestamps: true },
)

inventorySchema.plugin(auditablePlugin)

inventorySchema.index({ status: 1 })
inventorySchema.index({ warehouseId: 1, status: 1 })
inventorySchema.index({ farmerId: 1 })
inventorySchema.index({ produceType: 1 })
inventorySchema.index({ expiryDate: 1 })

export const Inventory = model<IInventory>('Inventory', inventorySchema)
