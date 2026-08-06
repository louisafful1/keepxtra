import type { GpsCoordinates } from '../models/farmer.model'
import type { PickupStatus } from '../models/pickup.model'
import type { StorageRequestUnit } from '../models/storageRequest.model'

export interface PickupDto {
  id: string
  pickupNumber: string
  storageRequestId: string
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
  collectedBy: string | null
  collectedAt: Date | null

  completedBy: string | null
  completedAt: Date | null

  cancelledBy: string | null
  cancelledAt: Date | null
  cancellationReason: string | null

  createdAt: Date
  updatedAt: Date
}
