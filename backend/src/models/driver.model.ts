import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended'

export interface IDriver extends Document {
  driverCode: string
  userId: Types.ObjectId | null
  name: string
  phone: string
  licenseNumber: string
  licenseExpiryDate: Date
  status: DriverStatus
  assignedVehicleId: Types.ObjectId | null
  totalTripsCompleted: number
  performanceRating: number | null
  notes: string | null

  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const driverSchema = new Schema<IDriver>(
  {
    driverCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    licenseExpiryDate: { type: Date, required: true },
    status: { type: String, enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'], default: 'Available' },
    assignedVehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    totalTripsCompleted: { type: Number, required: true, min: 0, default: 0 },
    performanceRating: { type: Number, default: null, min: 0, max: 5 },
    notes: { type: String, default: null },
  },
  { timestamps: true },
)

driverSchema.plugin(auditablePlugin)

driverSchema.index({ status: 1 })
driverSchema.index({ assignedVehicleId: 1 })

export const Driver = model<IDriver>('Driver', driverSchema)
