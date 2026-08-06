import { z } from 'zod'
import { listQuerySchema } from './common.validators'

const UNITS = ['kg', 'tons', 'bags', 'crates'] as const
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'] as const

const gpsCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const harvestDateSchema = z.coerce
  .date()
  .refine((date) => date <= startOfToday(), 'Harvest date cannot be in the future')

// No `.default([])` here — under `.partial()` (used by updateStorageRequestSchema
// below) a Zod default fires for any *omitted* key regardless of partial-ness,
// which would silently reintroduce `photos: []` into every PATCH and wipe out
// whatever was actually attached. See the identical fix in farmer.validators.ts.
const photosSchema = z.array(z.string().url('Each photo must be a valid URL')).optional()

const storageRequestFieldsSchema = z.object({
  produceType: z.string().trim().min(1, 'Produce type is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.enum(UNITS),
  estimatedWeightKg: z.number().positive('Estimated weight must be greater than 0'),
  harvestDate: harvestDateSchema,
  pickupLocation: z.string().trim().min(1, 'Pickup location is required'),
  gpsCoordinates: gpsCoordinatesSchema.optional(),
  preferredPickupDate: z.coerce.date(),
  preferredPickupTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Preferred pickup time must be in HH:MM (24-hour) format'),
  specialInstructions: z.string().trim().min(1).optional(),
  photos: photosSchema,
})

/** Cross-field rule: the pickup can't be scheduled before the produce is even harvested. */
function requirePickupNotBeforeHarvest<T extends { harvestDate: Date; preferredPickupDate: Date }>(data: T, ctx: z.RefinementCtx) {
  if (data.preferredPickupDate < data.harvestDate) {
    ctx.addIssue({ code: 'custom', path: ['preferredPickupDate'], message: 'Preferred pickup date cannot be before the harvest date' })
  }
}

export const createStorageRequestSchema = storageRequestFieldsSchema
  .extend({ photos: z.array(z.string().url('Each photo must be a valid URL')).optional().default([]) })
  .superRefine(requirePickupNotBeforeHarvest)

// Partial for PATCH — `requestNumber`, `farmerId`, `status`, and every
// approval/rejection/cancellation field are deliberately absent (immutable,
// or only ever set by their own dedicated action endpoint). `.strict()`
// rejects any attempt to sneak them in via the request body.
export const updateStorageRequestSchema = storageRequestFieldsSchema.partial().strict()

export const rejectStorageRequestSchema = z.object({
  reason: z.string().trim().min(1, 'A rejection reason is required'),
})

export const cancelStorageRequestSchema = z.object({
  reason: z.string().trim().min(1).optional(),
})

export const updatePrioritySchema = z.object({
  priority: z.enum(PRIORITIES),
})

export const updateInternalNotesSchema = z.object({
  internalNotes: z.string().trim().min(1, 'Internal notes cannot be empty'),
})

export const storageRequestListQuerySchema = listQuerySchema.extend({
  status: z
    .enum(['Draft', 'Submitted', 'Under Review', 'Approved', 'Pickup Scheduled', 'Completed', 'Rejected', 'Cancelled'])
    .optional(),
  priority: z.enum(PRIORITIES).optional(),
  produceType: z.string().trim().optional(),
  region: z.string().trim().optional(),
  harvestDateFrom: z.string().optional(),
  harvestDateTo: z.string().optional(),
  pickupDateFrom: z.string().optional(),
  pickupDateTo: z.string().optional(),
})

export type CreateStorageRequestInput = z.infer<typeof createStorageRequestSchema>
export type UpdateStorageRequestInput = z.infer<typeof updateStorageRequestSchema>
export type RejectStorageRequestInput = z.infer<typeof rejectStorageRequestSchema>
export type CancelStorageRequestInput = z.infer<typeof cancelStorageRequestSchema>
export type UpdatePriorityInput = z.infer<typeof updatePrioritySchema>
export type UpdateInternalNotesInput = z.infer<typeof updateInternalNotesSchema>
export type StorageRequestListQuery = z.infer<typeof storageRequestListQuerySchema>
