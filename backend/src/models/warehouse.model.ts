import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'
import type { GpsCoordinates } from './farmer.model'

export type WarehouseStatus = 'Active' | 'Inactive' | 'Under Maintenance'

export interface IWarehouseZone {
  _id: Types.ObjectId
  name: string
  capacityKg: number
  currentOccupancyKg: number
}

/**
 * `currentOccupancyKg` (both here and per-zone) is a manually-adjusted
 * stand-in until the Inventory module (a later phase) exists to derive it
 * automatically from actual stored produce — see `adjustOccupancy` in
 * `warehouse.service.ts`. Once a warehouse has zones, its top-level
 * occupancy is always the *sum* of its zones' occupancy, never set
 * directly — that invariant is enforced in the service layer.
 */
export interface IWarehouse extends Document {
  warehouseCode: string
  name: string
  location: string
  district: string
  region: string
  gpsCoordinates: GpsCoordinates | null
  totalCapacityKg: number
  currentOccupancyKg: number
  zones: IWarehouseZone[]
  status: WarehouseStatus
  notes: string | null

  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const gpsCoordinatesSchema = new Schema<GpsCoordinates>(
  { lat: { type: Number, required: true, min: -90, max: 90 }, lng: { type: Number, required: true, min: -180, max: 180 } },
  { _id: false },
)

const warehouseZoneSchema = new Schema<IWarehouseZone>({
  name: { type: String, required: true, trim: true },
  capacityKg: { type: Number, required: true, min: 0.01 },
  currentOccupancyKg: { type: Number, required: true, min: 0, default: 0 },
})

const warehouseSchema = new Schema<IWarehouse>(
  {
    warehouseCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    gpsCoordinates: { type: gpsCoordinatesSchema, default: null },
    totalCapacityKg: { type: Number, required: true, min: 0.01 },
    currentOccupancyKg: { type: Number, required: true, min: 0, default: 0 },
    zones: { type: [warehouseZoneSchema], default: [] },
    status: { type: String, enum: ['Active', 'Inactive', 'Under Maintenance'], default: 'Active' },
    notes: { type: String, default: null },
  },
  { timestamps: true },
)

warehouseSchema.plugin(auditablePlugin)

warehouseSchema.index({ status: 1 })
warehouseSchema.index({ region: 1, district: 1 })
warehouseSchema.index({ name: 1 })

export const Warehouse = model<IWarehouse>('Warehouse', warehouseSchema)
