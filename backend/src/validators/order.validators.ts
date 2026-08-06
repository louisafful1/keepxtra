import { z } from 'zod'
import { listQuerySchema } from './common.validators'

const ORDER_STATUSES = ['Draft', 'Confirmed', 'Delivered', 'Cancelled'] as const

const orderItemInputSchema = z.object({
  inventoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid inventory id format'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
})

export const createOrderSchema = z.object({
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer id format'),
  items: z.array(orderItemInputSchema).min(1, 'An order must have at least one item'),
  deliveryAddress: z.string().trim().min(1).optional(),
  deliveryDate: z.coerce.date().optional(),
  notes: z.string().trim().min(1).optional(),
})

// Only non-financial fields are editable after creation — changing items or
// customer requires cancelling and recreating the draft, so the financial
// snapshot (subtotal/farmerEarnings/profit) never needs recomputing here.
export const updateOrderSchema = z
  .object({
    deliveryAddress: z.string().trim().min(1).optional(),
    deliveryDate: z.coerce.date().optional(),
    notes: z.string().trim().min(1).optional(),
  })
  .strict()

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(1, 'A cancellation reason is required'),
})

export const orderListQuerySchema = listQuerySchema.extend({
  status: z.enum(ORDER_STATUSES).optional(),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer id format').optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
export type OrderListQuery = z.infer<typeof orderListQuerySchema>
