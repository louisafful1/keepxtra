import type { ColdRoomStatus } from '../models/coldRoom.model'

export interface ColdRoomDto {
  id: string
  coldRoomCode: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string

  name: string
  capacityKg: number
  currentOccupancyKg: number
  availableCapacityKg: number
  utilizationPercent: number

  targetTemperatureMinC: number
  targetTemperatureMaxC: number
  currentTemperatureC: number | null

  targetHumidityMinPercent: number
  targetHumidityMaxPercent: number
  currentHumidityPercent: number | null

  lastReadingAt: Date | null
  status: ColdRoomStatus
  isAvailable: boolean
  alerts: string[]
  notes: string | null

  createdAt: Date
  updatedAt: Date
}

export interface ColdRoomStatsSummaryDto {
  coldRoomCount: number
  totalCapacityKg: number
  totalOccupancyKg: number
  availableCapacityKg: number
  utilizationPercent: number
  byStatus: Record<ColdRoomStatus, number>
  withActiveAlerts: number
}
