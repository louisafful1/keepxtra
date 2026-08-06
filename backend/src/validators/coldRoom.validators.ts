import { z } from 'zod'
import { listQuerySchema } from './common.validators'

const COLD_ROOM_STATUSES = ['Active', 'Inactive', 'Under Maintenance'] as const

/** Cross-field rule: a target range's minimum can't sit above its own maximum. */
function requireValidTargetRanges<
  T extends { targetTemperatureMinC: number; targetTemperatureMaxC: number; targetHumidityMinPercent: number; targetHumidityMaxPercent: number },
>(data: T, ctx: z.RefinementCtx) {
  if (data.targetTemperatureMinC > data.targetTemperatureMaxC) {
    ctx.addIssue({ code: 'custom', path: ['targetTemperatureMaxC'], message: 'targetTemperatureMaxC cannot be below targetTemperatureMinC' })
  }
  if (data.targetHumidityMinPercent > data.targetHumidityMaxPercent) {
    ctx.addIssue({ code: 'custom', path: ['targetHumidityMaxPercent'], message: 'targetHumidityMaxPercent cannot be below targetHumidityMinPercent' })
  }
}

const coldRoomFieldsSchema = z.object({
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse id format'),
  name: z.string().trim().min(1, 'Name is required'),
  capacityKg: z.number().positive('Capacity must be greater than 0'),
  targetTemperatureMinC: z.number().min(-50).max(50),
  targetTemperatureMaxC: z.number().min(-50).max(50),
  targetHumidityMinPercent: z.number().min(0).max(100),
  targetHumidityMaxPercent: z.number().min(0).max(100),
  notes: z.string().trim().min(1).optional(),
})

export const createColdRoomSchema = coldRoomFieldsSchema.superRefine(requireValidTargetRanges)

// Partial for PATCH — `warehouseId`, `coldRoomCode`, `currentOccupancyKg`,
// current readings, and `status` are deliberately absent (immutable,
// derived, or changed only via their own dedicated endpoint). `.strict()`
// rejects any attempt to sneak them in.
export const updateColdRoomSchema = coldRoomFieldsSchema
  .omit({ warehouseId: true })
  .partial()
  .strict()

export const updateColdRoomStatusSchema = z.object({
  status: z.enum(COLD_ROOM_STATUSES),
})

export const recordReadingSchema = z
  .object({
    temperatureC: z.number().min(-50).max(50).optional(),
    humidityPercent: z.number().min(0).max(100).optional(),
  })
  .refine((data) => data.temperatureC !== undefined || data.humidityPercent !== undefined, {
    message: 'At least one of temperatureC or humidityPercent is required',
    path: ['temperatureC'],
  })

export const adjustOccupancySchema = z.object({
  occupancyKg: z.number().min(0, 'Occupancy cannot be negative'),
})

export const coldRoomListQuerySchema = listQuerySchema.extend({
  status: z.enum(COLD_ROOM_STATUSES).optional(),
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse id format').optional(),
})

export type CreateColdRoomInput = z.infer<typeof createColdRoomSchema>
export type UpdateColdRoomInput = z.infer<typeof updateColdRoomSchema>
export type UpdateColdRoomStatusInput = z.infer<typeof updateColdRoomStatusSchema>
export type RecordReadingInput = z.infer<typeof recordReadingSchema>
export type AdjustOccupancyInput = z.infer<typeof adjustOccupancySchema>
export type ColdRoomListQuery = z.infer<typeof coldRoomListQuerySchema>
