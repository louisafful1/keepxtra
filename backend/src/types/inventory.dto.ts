import type { InventoryStatus } from '../models/inventory.model'
import type { InventoryMovementType } from '../models/inventoryMovement.model'
import type { StorageRequestUnit } from '../models/storageRequest.model'

export interface InventoryDto {
  id: string
  inventoryCode: string
  pickupId: string
  storageRequestId: string
  requestNumber: string
  farmerId: string
  farmerName: string
  farmerNumber: string

  produceType: string
  unit: StorageRequestUnit
  harvestDate: Date

  initialQuantity: number
  currentQuantity: number
  reservedQuantity: number
  availableQuantity: number

  warehouseId: string | null
  warehouseCode: string | null
  warehouseName: string | null
  coldRoomId: string | null
  coldRoomCode: string | null

  shelfLifeDays: number | null
  expiryDate: Date | null
  valuePerUnit: number | null
  totalValue: number | null

  status: InventoryStatus
  receivedAt: Date | null
  receivedBy: string | null
  disposedAt: Date | null
  disposedBy: string | null
  disposalReason: string | null

  isExpired: boolean
  isNearExpiry: boolean
  isLowStock: boolean

  createdAt: Date
  updatedAt: Date
}

export interface InventoryMovementDto {
  id: string
  inventoryId: string
  type: InventoryMovementType
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  reason: string | null
  fromWarehouseId: string | null
  toWarehouseId: string | null
  performedBy: string
  createdAt: Date
}

export interface InventoryIntelligenceSummaryDto {
  totalItems: number
  totalQuantity: number
  totalValue: number
  lowStockCount: number
  nearExpiryCount: number
  expiredCount: number
  overstockedWarehouses: number
  overstockedColdRooms: number
}
