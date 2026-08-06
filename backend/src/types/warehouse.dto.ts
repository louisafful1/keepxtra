import type { GpsCoordinates } from '../models/farmer.model'
import type { WarehouseStatus } from '../models/warehouse.model'

export interface WarehouseZoneDto {
  id: string
  name: string
  capacityKg: number
  currentOccupancyKg: number
}

export interface WarehouseDto {
  id: string
  warehouseCode: string
  name: string
  location: string
  district: string
  region: string
  gpsCoordinates: GpsCoordinates | null
  totalCapacityKg: number
  currentOccupancyKg: number
  zones: WarehouseZoneDto[]
  status: WarehouseStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface WarehouseZoneStatsDto {
  id: string
  name: string
  capacityKg: number
  currentOccupancyKg: number
  availableCapacityKg: number
  utilizationPercent: number
}

export interface WarehouseStatsDto {
  warehouseId: string
  warehouseCode: string
  totalCapacityKg: number
  currentOccupancyKg: number
  availableCapacityKg: number
  utilizationPercent: number
  zones: WarehouseZoneStatsDto[]
}

export interface WarehouseStatsSummaryDto {
  warehouseCount: number
  totalCapacityKg: number
  totalOccupancyKg: number
  availableCapacityKg: number
  utilizationPercent: number
  byStatus: Record<WarehouseStatus, number>
}
