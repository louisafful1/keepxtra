import type { GpsCoordinates } from '../models/farmer.model'
import type { StorageRequestPriority, StorageRequestStatus, StorageRequestUnit } from '../models/storageRequest.model'

export interface StorageRequestDto {
  id: string
  requestNumber: string
  farmerId: string
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

  approvedBy: string | null
  approvedAt: Date | null
  rejectedBy: string | null
  rejectedAt: Date | null
  rejectionReason: string | null
  cancelledBy: string | null
  cancelledAt: Date | null
  cancellationReason: string | null

  priority: StorageRequestPriority
  internalNotes: string | null

  createdAt: Date
  updatedAt: Date
}
