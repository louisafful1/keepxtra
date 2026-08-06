import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'

export type ColdRoomStatus = 'Active' | 'Inactive' | 'Under Maintenance'

/**
 * A Cold Room is a temperature-controlled space inside a Warehouse —
 * modeled as its own top-level collection (not a Warehouse zone) since the
 * spec treats Warehouse and Cold Room management as separate modules with
 * separate feature sets (temperature/humidity monitoring, alerts). It does
 * not sync with `Warehouse.currentOccupancyKg`/`zones` — both are
 * independent manually-adjusted stand-ins until the Inventory module (a
 * later phase) unifies real stock tracking across the platform.
 */
export interface IColdRoom extends Document {
  coldRoomCode: string
  warehouseId: Types.ObjectId
  // Denormalized at creation time — same immutable-snapshot pattern used
  // throughout (see storageRequest.model.ts) so search/filter can reuse the
  // plain regex-based `buildFilterQuery` util instead of a $lookup join.
  warehouseCode: string
  warehouseName: string

  name: string
  capacityKg: number
  currentOccupancyKg: number

  targetTemperatureMinC: number
  targetTemperatureMaxC: number
  currentTemperatureC: number | null

  targetHumidityMinPercent: number
  targetHumidityMaxPercent: number
  currentHumidityPercent: number | null

  lastReadingAt: Date | null
  status: ColdRoomStatus
  notes: string | null

  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const coldRoomSchema = new Schema<IColdRoom>(
  {
    coldRoomCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    warehouseCode: { type: String, required: true, trim: true, uppercase: true },
    warehouseName: { type: String, required: true, trim: true },

    name: { type: String, required: true, trim: true },
    capacityKg: { type: Number, required: true, min: 0.01 },
    currentOccupancyKg: { type: Number, required: true, min: 0, default: 0 },

    targetTemperatureMinC: { type: Number, required: true },
    targetTemperatureMaxC: { type: Number, required: true },
    currentTemperatureC: { type: Number, default: null },

    targetHumidityMinPercent: { type: Number, required: true, min: 0, max: 100 },
    targetHumidityMaxPercent: { type: Number, required: true, min: 0, max: 100 },
    currentHumidityPercent: { type: Number, default: null, min: 0, max: 100 },

    lastReadingAt: { type: Date, default: null },
    status: { type: String, enum: ['Active', 'Inactive', 'Under Maintenance'], default: 'Active' },
    notes: { type: String, default: null },
  },
  { timestamps: true },
)

coldRoomSchema.plugin(auditablePlugin)

coldRoomSchema.index({ warehouseId: 1, status: 1 })
coldRoomSchema.index({ status: 1 })

export const ColdRoom = model<IColdRoom>('ColdRoom', coldRoomSchema)
