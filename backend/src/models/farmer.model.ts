import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'

export type FarmerStatus = 'Active' | 'Inactive'
export type PaymentMethod = 'Mobile Money' | 'Bank Transfer'
export type PickupDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export interface GpsCoordinates {
  lat: number
  lng: number
}

export interface BankDetails {
  bankName: string
  accountNumber: string
  accountName: string
}

export interface MobileMoneyDetails {
  provider: string
  phoneNumber: string
}

export interface IFarmer extends Document {
  userId: Types.ObjectId
  farmerNumber: string
  firstName: string
  lastName: string
  phone: string
  alternativePhone: string | null
  email: string
  nationalId: string | null
  farmName: string
  farmLocation: string
  district: string
  region: string
  gpsCoordinates: GpsCoordinates | null
  primaryCrops: string[]
  preferredPickupDays: PickupDay[]
  preferredPaymentMethod: PaymentMethod
  bankDetails: BankDetails | null
  mobileMoneyDetails: MobileMoneyDetails | null
  status: FarmerStatus
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

const bankDetailsSchema = new Schema<BankDetails>(
  {
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const mobileMoneyDetailsSchema = new Schema<MobileMoneyDetails>(
  {
    provider: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const PICKUP_DAYS: PickupDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const farmerSchema = new Schema<IFarmer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    farmerNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    alternativePhone: { type: String, default: null, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    nationalId: { type: String, default: null, trim: true },
    farmName: { type: String, required: true, trim: true },
    farmLocation: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    gpsCoordinates: { type: gpsCoordinatesSchema, default: null },
    primaryCrops: {
      type: [String],
      required: true,
      validate: { validator: (value: string[]) => value.length > 0, message: 'At least one primary crop is required' },
    },
    preferredPickupDays: { type: [String], enum: PICKUP_DAYS, default: [] },
    preferredPaymentMethod: { type: String, enum: ['Mobile Money', 'Bank Transfer'], required: true },
    bankDetails: { type: bankDetailsSchema, default: null },
    mobileMoneyDetails: { type: mobileMoneyDetailsSchema, default: null },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    notes: { type: String, default: null },
  },
  { timestamps: true },
)

farmerSchema.plugin(auditablePlugin)

farmerSchema.index({ status: 1 })
farmerSchema.index({ region: 1, district: 1 })
farmerSchema.index({ primaryCrops: 1 })
farmerSchema.index({ firstName: 1, lastName: 1 })

export const Farmer = model<IFarmer>('Farmer', farmerSchema)
