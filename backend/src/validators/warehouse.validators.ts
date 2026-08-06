import { z } from 'zod'
import { listQuerySchema } from './common.validators'

const WAREHOUSE_STATUSES = ['Active', 'Inactive', 'Under Maintenance'] as const

const gpsCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

const zoneSchema = z.object({
  name: z.string().trim().min(1, 'Zone name is required'),
  capacityKg: z.number().positive('Zone capacity must be greater than 0'),
  currentOccupancyKg: z.number().min(0).optional(),
})

/**
 * Cross-field rule: zones can't collectively promise more space than the
 * warehouse actually has. `zones` is never optional by the time this runs —
 * only wired to `createWarehouseSchema`, whose `.extend({ zones: ...default([]) })`
 * already guarantees an array — so there's no `?? []` fallback to write here.
 */
function requireZonesFitCapacity<T extends { totalCapacityKg: number; zones: { capacityKg: number }[] }>(data: T, ctx: z.RefinementCtx) {
  const zoneCapacitySum = data.zones.reduce((sum, zone) => sum + zone.capacityKg, 0)
  if (zoneCapacitySum > data.totalCapacityKg) {
    ctx.addIssue({ code: 'custom', path: ['zones'], message: 'The sum of zone capacities cannot exceed the warehouse total capacity' })
  }
}

// No `.default([])` here — see the identical fix in storageRequest.validators.ts;
// under `.partial()` (used by updateWarehouseSchema below) a Zod default fires
// for any *omitted* key regardless of partial-ness, silently reintroducing
// `zones: []` into every PATCH and wiping out whatever the warehouse actually had.
const zonesSchema = z.array(zoneSchema).optional()

const warehouseFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  location: z.string().trim().min(1, 'Location is required'),
  district: z.string().trim().min(1, 'District is required'),
  region: z.string().trim().min(1, 'Region is required'),
  gpsCoordinates: gpsCoordinatesSchema.optional(),
  totalCapacityKg: z.number().positive('Total capacity must be greater than 0'),
  zones: zonesSchema,
  notes: z.string().trim().min(1).optional(),
})

export const createWarehouseSchema = warehouseFieldsSchema
  .extend({ zones: z.array(zoneSchema).optional().default([]) })
  .superRefine(requireZonesFitCapacity)

// Partial for PATCH — `warehouseCode`, `currentOccupancyKg`, and `status` are
// deliberately absent (immutable, derived, or changed only via their own
// dedicated endpoint). `.strict()` rejects any attempt to sneak them in.
export const updateWarehouseSchema = warehouseFieldsSchema.partial().strict()

export const updateWarehouseStatusSchema = z.object({
  status: z.enum(WAREHOUSE_STATUSES),
})

export const adjustOccupancySchema = z.object({
  zoneId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid zone id format').optional(),
  occupancyKg: z.number().min(0, 'Occupancy cannot be negative'),
})

export const warehouseListQuerySchema = listQuerySchema.extend({
  status: z.enum(WAREHOUSE_STATUSES).optional(),
  region: z.string().trim().optional(),
  district: z.string().trim().optional(),
})

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>
export type UpdateWarehouseStatusInput = z.infer<typeof updateWarehouseStatusSchema>
export type AdjustOccupancyInput = z.infer<typeof adjustOccupancySchema>
export type WarehouseListQuery = z.infer<typeof warehouseListQuerySchema>
