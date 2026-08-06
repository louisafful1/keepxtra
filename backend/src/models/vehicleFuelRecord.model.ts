import { Schema, model, type Document, type Types } from 'mongoose'

/** Append-only ledger — same "own collection, never updated" reasoning as InventoryMovement. */
export interface IVehicleFuelRecord extends Document {
  vehicleId: Types.ObjectId
  litres: number
  costAmount: number
  odometerKm: number
  recordedAt: Date
  recordedBy: Types.ObjectId
  createdAt: Date
}

const vehicleFuelRecordSchema = new Schema<IVehicleFuelRecord>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    litres: { type: Number, required: true, min: 0.01 },
    costAmount: { type: Number, required: true, min: 0 },
    odometerKm: { type: Number, required: true, min: 0 },
    recordedAt: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

vehicleFuelRecordSchema.index({ vehicleId: 1, recordedAt: -1 })

export const VehicleFuelRecord = model<IVehicleFuelRecord>('VehicleFuelRecord', vehicleFuelRecordSchema)
