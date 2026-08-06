import { Schema, model, type Document, type Types } from 'mongoose'

export type MaintenanceType = 'Service' | 'Repair' | 'Inspection'

/** Append-only ledger — same "own collection, never updated" reasoning as InventoryMovement. */
export interface IVehicleMaintenanceRecord extends Document {
  vehicleId: Types.ObjectId
  type: MaintenanceType
  description: string
  costAmount: number | null
  odometerKm: number | null
  performedAt: Date
  performedBy: Types.ObjectId
  createdAt: Date
}

const vehicleMaintenanceRecordSchema = new Schema<IVehicleMaintenanceRecord>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: { type: String, enum: ['Service', 'Repair', 'Inspection'], required: true },
    description: { type: String, required: true, trim: true },
    costAmount: { type: Number, default: null, min: 0 },
    odometerKm: { type: Number, default: null, min: 0 },
    performedAt: { type: Date, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

vehicleMaintenanceRecordSchema.index({ vehicleId: 1, performedAt: -1 })

export const VehicleMaintenanceRecord = model<IVehicleMaintenanceRecord>('VehicleMaintenanceRecord', vehicleMaintenanceRecordSchema)
