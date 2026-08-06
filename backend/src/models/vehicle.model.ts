import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'

export type VehicleStatus = 'Available' | 'On Trip' | 'Under Maintenance' | 'Out of Service'

export interface IVehicle extends Document {
  vehicleCode: string
  plateNumber: string
  type: string
  make: string | null
  // Named `vehicleModel`, not `model` — `model` is a reserved method name on
  // Mongoose's `Document` interface (`doc.model('OtherCollection')`).
  vehicleModel: string | null
  year: number | null
  capacityKg: number
  fuelType: string | null
  currentMileageKm: number
  status: VehicleStatus
  assignedDriverId: Types.ObjectId | null
  notes: string | null

  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const vehicleSchema = new Schema<IVehicle>(
  {
    vehicleCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    plateNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    type: { type: String, required: true, trim: true },
    make: { type: String, default: null, trim: true },
    vehicleModel: { type: String, default: null, trim: true },
    year: { type: Number, default: null },
    capacityKg: { type: Number, required: true, min: 0.01 },
    fuelType: { type: String, default: null, trim: true },
    currentMileageKm: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: ['Available', 'On Trip', 'Under Maintenance', 'Out of Service'], default: 'Available' },
    assignedDriverId: { type: Schema.Types.ObjectId, ref: 'Driver', default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true },
)

vehicleSchema.plugin(auditablePlugin)

vehicleSchema.index({ status: 1 })
vehicleSchema.index({ assignedDriverId: 1 })

export const Vehicle = model<IVehicle>('Vehicle', vehicleSchema)
