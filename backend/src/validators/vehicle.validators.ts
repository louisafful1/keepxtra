import { z } from 'zod'
import { listQuerySchema } from './common.validators'

const VEHICLE_STATUSES = ['Available', 'On Trip', 'Under Maintenance', 'Out of Service'] as const
const MAINTENANCE_TYPES = ['Service', 'Repair', 'Inspection'] as const

const vehicleFieldsSchema = z.object({
  plateNumber: z.string().trim().min(1, 'Plate number is required'),
  type: z.string().trim().min(1, 'Vehicle type is required'),
  make: z.string().trim().min(1).optional(),
  vehicleModel: z.string().trim().min(1).optional(),
  year: z.number().int().min(1980).max(2100).optional(),
  capacityKg: z.number().positive('Capacity must be greater than 0'),
  fuelType: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
})

export const createVehicleSchema = vehicleFieldsSchema

// Partial for PATCH — `vehicleCode`, `currentMileageKm`, `assignedDriverId`,
// and `status` are deliberately absent (immutable, derived, or changed
// only via their own dedicated endpoint). `.strict()` rejects any attempt
// to sneak them in.
export const updateVehicleSchema = vehicleFieldsSchema.partial().strict()

export const updateVehicleStatusSchema = z.object({
  status: z.enum(VEHICLE_STATUSES),
})

export const logMaintenanceSchema = z.object({
  type: z.enum(MAINTENANCE_TYPES),
  description: z.string().trim().min(1, 'Description is required'),
  costAmount: z.number().min(0).optional(),
  odometerKm: z.number().min(0).optional(),
  performedAt: z.coerce.date(),
})

export const logFuelSchema = z.object({
  litres: z.number().positive('Litres must be greater than 0'),
  costAmount: z.number().min(0, 'Cost cannot be negative'),
  odometerKm: z.number().min(0, 'Odometer reading cannot be negative'),
  recordedAt: z.coerce.date(),
})

export const vehicleListQuerySchema = listQuerySchema.extend({
  status: z.enum(VEHICLE_STATUSES).optional(),
  type: z.string().trim().optional(),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type UpdateVehicleStatusInput = z.infer<typeof updateVehicleStatusSchema>
export type LogMaintenanceInput = z.infer<typeof logMaintenanceSchema>
export type LogFuelInput = z.infer<typeof logFuelSchema>
export type VehicleListQuery = z.infer<typeof vehicleListQuerySchema>
