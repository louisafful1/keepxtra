import { z } from 'zod'
import { listQuerySchema, paginationQuerySchema } from './common.validators'

export const receiveInventorySchema = z.object({
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse id format'),
  coldRoomId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid cold room id format').optional(),
  shelfLifeDays: z.number().int().positive('Shelf life must be at least 1 day'),
  valuePerUnit: z.number().min(0).optional(),
})

export const adjustInventorySchema = z.object({
  quantityChange: z.number().refine((value) => value !== 0, 'quantityChange cannot be zero'),
  reason: z.string().trim().min(1, 'A reason is required'),
})

export const transferInventorySchema = z.object({
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse id format'),
  coldRoomId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid cold room id format').optional(),
})

export const disposeInventorySchema = z.object({
  reason: z.string().trim().min(1, 'A disposal reason is required'),
})

export const inventoryListQuerySchema = listQuerySchema.extend({
  status: z.enum(['Pending Placement', 'In Stock', 'Depleted', 'Disposed']).optional(),
  produceType: z.string().trim().optional(),
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse id format').optional(),
  nearExpiry: z.coerce.boolean().optional(),
  expired: z.coerce.boolean().optional(),
  lowStock: z.coerce.boolean().optional(),
})

export const movementListQuerySchema = paginationQuerySchema

export type ReceiveInventoryInput = z.infer<typeof receiveInventorySchema>
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>
export type TransferInventoryInput = z.infer<typeof transferInventorySchema>
export type DisposeInventoryInput = z.infer<typeof disposeInventorySchema>
export type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>
export type MovementListQuery = z.infer<typeof movementListQuerySchema>
