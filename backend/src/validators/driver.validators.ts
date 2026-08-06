import { z } from 'zod'
import { listQuerySchema } from './common.validators'

const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'] as const

const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number')
  .max(20, 'Enter a valid phone number')
  .regex(/^\+?[0-9\s-]+$/, 'Enter a valid phone number')

const driverFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: phoneSchema,
  licenseNumber: z.string().trim().min(1, 'License number is required'),
  licenseExpiryDate: z.coerce.date(),
  notes: z.string().trim().min(1).optional(),
})

export const createDriverSchema = driverFieldsSchema

// Partial for PATCH — `driverCode`, `assignedVehicleId`,
// `totalTripsCompleted`, and `status` are deliberately absent (immutable,
// derived, or changed only via their own dedicated endpoint). `.strict()`
// rejects any attempt to sneak them in.
export const updateDriverSchema = driverFieldsSchema.partial().strict()

export const updateDriverStatusSchema = z.object({
  status: z.enum(DRIVER_STATUSES),
})

export const assignVehicleSchema = z.object({
  vehicleId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle id format')
    .nullable(),
})

export const logTripSchema = z.object({
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().trim().min(1).optional(),
})

export const driverListQuerySchema = listQuerySchema.extend({
  status: z.enum(DRIVER_STATUSES).optional(),
})

export type CreateDriverInput = z.infer<typeof createDriverSchema>
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>
export type UpdateDriverStatusInput = z.infer<typeof updateDriverStatusSchema>
export type AssignVehicleInput = z.infer<typeof assignVehicleSchema>
export type LogTripInput = z.infer<typeof logTripSchema>
export type DriverListQuery = z.infer<typeof driverListQuerySchema>
