import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'
import type { GpsCoordinates } from './farmer.model'
import type { StorageRequestUnit } from './storageRequest.model'

export type PickupStatus = 'Pending' | 'Scheduled' | 'En Route' | 'Arrived' | 'Collected' | 'Completed' | 'Cancelled'

/**
 * A Pickup is always born from an approved StorageRequest — there is no
 * manual "create" endpoint. `pickupAutoCreate.listener.ts` creates one the
 * moment `STORAGE_REQUEST_EVENTS.APPROVED` fires, in `Pending` status
 * (awaiting driver/vehicle assignment). Driver/vehicle are plain fields
 * rather than references — the Fleet & Driver module (a later phase) hasn't
 * shipped yet, so there's no Driver/Vehicle collection to point at.
 */
export interface IPickup extends Document {
  pickupNumber: string
  storageRequestId: Types.ObjectId
  requestNumber: string
  farmerId: Types.ObjectId
  farmerName: string
  farmerNumber: string
  district: string
  region: string

  produceType: string
  quantity: number
  unit: StorageRequestUnit
  estimatedWeightKg: number
  pickupLocation: string
  gpsCoordinates: GpsCoordinates | null

  scheduledDate: Date | null
  scheduledTime: string | null
  driverName: string | null
  driverPhone: string | null
  vehiclePlateNumber: string | null
  vehicleType: string | null
  routeNotes: string | null

  status: PickupStatus

  collectedQuantity: number | null
  collectedWeightKg: number | null
  collectionGpsCoordinates: GpsCoordinates | null
  collectionPhotos: string[]
  collectionNotes: string | null
  collectedBy: Types.ObjectId | null
  collectedAt: Date | null

  completedBy: Types.ObjectId | null
  completedAt: Date | null

  cancelledBy: Types.ObjectId | null
  cancelledAt: Date | null
  cancellationReason: string | null

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

const pickupSchema = new Schema<IPickup>(
  {
    pickupNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    storageRequestId: { type: Schema.Types.ObjectId, ref: 'StorageRequest', required: true, unique: true },
    requestNumber: { type: String, required: true, trim: true, uppercase: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true },
    farmerName: { type: String, required: true, trim: true },
    farmerNumber: { type: String, required: true, trim: true, uppercase: true },
    district: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },

    produceType: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, enum: ['kg', 'tons', 'bags', 'crates'], required: true },
    estimatedWeightKg: { type: Number, required: true, min: 0.01 },
    pickupLocation: { type: String, required: true, trim: true },
    gpsCoordinates: { type: gpsCoordinatesSchema, default: null },

    scheduledDate: { type: Date, default: null },
    scheduledTime: { type: String, default: null, trim: true },
    driverName: { type: String, default: null, trim: true },
    driverPhone: { type: String, default: null, trim: true },
    vehiclePlateNumber: { type: String, default: null, trim: true },
    vehicleType: { type: String, default: null, trim: true },
    routeNotes: { type: String, default: null },

    status: {
      type: String,
      enum: ['Pending', 'Scheduled', 'En Route', 'Arrived', 'Collected', 'Completed', 'Cancelled'],
      default: 'Pending',
    },

    collectedQuantity: { type: Number, default: null },
    collectedWeightKg: { type: Number, default: null },
    collectionGpsCoordinates: { type: gpsCoordinatesSchema, default: null },
    collectionPhotos: { type: [String], default: [] },
    collectionNotes: { type: String, default: null },
    collectedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    collectedAt: { type: Date, default: null },

    completedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },

    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
  },
  { timestamps: true },
)

pickupSchema.plugin(auditablePlugin)

pickupSchema.index({ status: 1, createdAt: -1 })
pickupSchema.index({ farmerId: 1, status: 1 })
pickupSchema.index({ region: 1, district: 1 })
pickupSchema.index({ produceType: 1 })
pickupSchema.index({ scheduledDate: 1 })
pickupSchema.index({ driverName: 1 })

export const Pickup = model<IPickup>('Pickup', pickupSchema)
