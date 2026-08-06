import type { DriverStatus } from '../models/driver.model'

export interface DriverDto {
  id: string
  driverCode: string
  userId: string | null
  name: string
  phone: string
  licenseNumber: string
  licenseExpiryDate: Date
  status: DriverStatus
  assignedVehicleId: string | null
  totalTripsCompleted: number
  performanceRating: number | null
  isLicenseExpired: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
}
