import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'
import type { GpsCoordinates } from './farmer.model'

export type StorageRequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Pickup Scheduled'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled'

export type StorageRequestUnit = 'kg' | 'tons' | 'bags' | 'crates'
export type StorageRequestPriority = 'Low' | 'Normal' | 'High' | 'Urgent'

export interface IStorageRequest extends Document {
  requestNumber: string
  farmerId: Types.ObjectId
  // Denormalized at creation time — the same immutable-snapshot pattern the
  // SAD uses for PickupRequest ("crop" copied from the storage request) —
  // so search/filter can reuse the plain regex-based `buildFilterQuery`
  // util instead of an aggregation $lookup against `farmers`.
  farmerName: string
  farmerNumber: string
  district: string
  region: string

  produceType: string
  quantity: number
  unit: StorageRequestUnit
  estimatedWeightKg: number
  harvestDate: Date
  pickupLocation: string
  gpsCoordinates: GpsCoordinates | null
  preferredPickupDate: Date
  preferredPickupTime: string
  specialInstructions: string | null
  photos: string[]

  status: StorageRequestStatus
  requestedAt: Date | null

  approvedBy: Types.ObjectId | null
  approvedAt: Date | null
  rejectedBy: Types.ObjectId | null
  rejectedAt: Date | null
  rejectionReason: string | null
  cancelledBy: Types.ObjectId | null
  cancelledAt: Date | null
  cancellationReason: string | null

  priority: StorageRequestPriority
  internalNotes: string | null

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

const storageRequestSchema = new Schema<IStorageRequest>(
  {
    requestNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true },
    farmerName: { type: String, required: true, trim: true },
    farmerNumber: { type: String, required: true, trim: true, uppercase: true },
    district: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },

    produceType: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, enum: ['kg', 'tons', 'bags', 'crates'], required: true },
    estimatedWeightKg: { type: Number, required: true, min: 0.01 },
    harvestDate: { type: Date, required: true },
    pickupLocation: { type: String, required: true, trim: true },
    gpsCoordinates: { type: gpsCoordinatesSchema, default: null },
    preferredPickupDate: { type: Date, required: true },
    preferredPickupTime: { type: String, required: true, trim: true },
    specialInstructions: { type: String, default: null },
    photos: { type: [String], default: [] },

    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Pickup Scheduled', 'Completed', 'Rejected', 'Cancelled'],
      default: 'Draft',
    },
    requestedAt: { type: Date, default: null },

    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },

    priority: { type: String, enum: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
    internalNotes: { type: String, default: null },
  },
  { timestamps: true },
)

storageRequestSchema.plugin(auditablePlugin)

storageRequestSchema.index({ farmerId: 1, status: 1 })
storageRequestSchema.index({ status: 1, createdAt: -1 })
storageRequestSchema.index({ priority: 1 })
storageRequestSchema.index({ region: 1, district: 1 })
storageRequestSchema.index({ produceType: 1 })
storageRequestSchema.index({ harvestDate: 1 })
storageRequestSchema.index({ preferredPickupDate: 1 })
// Enforces "a farmer cannot have multiple active requests for the same
// produce + harvest batch" at the database level, not just in the service —
// partial so it only applies to non-terminal (active) statuses.
storageRequestSchema.index(
  { farmerId: 1, produceType: 1, harvestDate: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Pickup Scheduled'] } },
  },
)

export const StorageRequest = model<IStorageRequest>('StorageRequest', storageRequestSchema)
