import { z } from 'zod'
import { listQuerySchema } from './common.validators'

const gpsCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const schedulePickupSchema = z.object({
  scheduledDate: z.coerce.date(),
  scheduledTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Scheduled time must be in HH:MM (24-hour) format'),
  driverName: z.string().trim().min(1, 'Driver name is required'),
  driverPhone: z.string().trim().min(1, 'Driver phone is required'),
  vehiclePlateNumber: z.string().trim().min(1, 'Vehicle plate number is required'),
  vehicleType: z.string().trim().min(1, 'Vehicle type is required'),
  routeNotes: z.string().trim().min(1).optional(),
})

// No `.default([])` here — see the identical fix in storageRequest.validators.ts;
// this schema is never used under `.partial()` today, but keeping the same
// convention avoids the trap being reintroduced if it ever is.
export const collectPickupSchema = z.object({
  collectedQuantity: z.number().positive('Collected quantity must be greater than 0'),
  collectedWeightKg: z.number().positive('Collected weight must be greater than 0'),
  collectionGpsCoordinates: gpsCoordinatesSchema.optional(),
  collectionPhotos: z.array(z.string().url('Each photo must be a valid URL')).optional().default([]),
  collectionNotes: z.string().trim().min(1).optional(),
})

export const cancelPickupSchema = z.object({
  reason: z.string().trim().min(1, 'A cancellation reason is required'),
})

export const updateRouteNotesSchema = z.object({
  routeNotes: z.string().trim().min(1, 'Route notes cannot be empty'),
})

export const pickupListQuerySchema = listQuerySchema.extend({
  status: z.enum(['Pending', 'Scheduled', 'En Route', 'Arrived', 'Collected', 'Completed', 'Cancelled']).optional(),
  produceType: z.string().trim().optional(),
  region: z.string().trim().optional(),
  scheduledDateFrom: z.string().optional(),
  scheduledDateTo: z.string().optional(),
})

export type SchedulePickupInput = z.infer<typeof schedulePickupSchema>
export type CollectPickupInput = z.infer<typeof collectPickupSchema>
export type CancelPickupInput = z.infer<typeof cancelPickupSchema>
export type UpdateRouteNotesInput = z.infer<typeof updateRouteNotesSchema>
export type PickupListQuery = z.infer<typeof pickupListQuerySchema>
