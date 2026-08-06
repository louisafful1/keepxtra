import type { VehicleStatus } from '../models/vehicle.model'
import type { MaintenanceType } from '../models/vehicleMaintenanceRecord.model'

export interface VehicleDto {
  id: string
  vehicleCode: string
  plateNumber: string
  type: string
  make: string | null
  vehicleModel: string | null
  year: number | null
  capacityKg: number
  fuelType: string | null
  currentMileageKm: number
  status: VehicleStatus
  assignedDriverId: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface MaintenanceRecordDto {
  id: string
  vehicleId: string
  type: MaintenanceType
  description: string
  costAmount: number | null
  odometerKm: number | null
  performedAt: Date
  performedBy: string
  createdAt: Date
}

export interface FuelRecordDto {
  id: string
  vehicleId: string
  litres: number
  costAmount: number
  odometerKm: number
  recordedAt: Date
  recordedBy: string
  createdAt: Date
}

export interface FleetStatsSummaryDto {
  vehicleCount: number
  byVehicleStatus: Record<VehicleStatus, number>
  totalCapacityKg: number
  utilizationPercent: number
  totalMaintenanceCostAmount: number
  totalFuelCostAmount: number
}
