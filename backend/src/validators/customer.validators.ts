import { z } from 'zod'
import { listQuerySchema } from './common.validators'

const CUSTOMER_TYPES = ['Restaurant', 'Hotel', 'Retailer', 'Wholesaler', 'Other'] as const
const CUSTOMER_STATUSES = ['Active', 'Inactive'] as const

const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number')
  .max(20, 'Enter a valid phone number')
  .regex(/^\+?[0-9\s-]+$/, 'Enter a valid phone number')

const customerFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  type: z.enum(CUSTOMER_TYPES),
  contactPerson: z.string().trim().min(1).optional(),
  phone: phoneSchema,
  email: z.string().trim().email('Enter a valid email address').optional(),
  address: z.string().trim().min(1, 'Address is required'),
  notes: z.string().trim().min(1).optional(),
})

export const createCustomerSchema = customerFieldsSchema

// Partial for PATCH — `customerCode` and `status` are deliberately absent
// (immutable, or changed only via the dedicated status endpoint).
// `.strict()` rejects any attempt to sneak them in.
export const updateCustomerSchema = customerFieldsSchema.partial().strict()

export const updateCustomerStatusSchema = z.object({
  status: z.enum(CUSTOMER_STATUSES),
})

export const customerListQuerySchema = listQuerySchema.extend({
  status: z.enum(CUSTOMER_STATUSES).optional(),
  type: z.enum(CUSTOMER_TYPES).optional(),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type UpdateCustomerStatusInput = z.infer<typeof updateCustomerStatusSchema>
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>
