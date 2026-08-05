import { z } from 'zod'
import { listQuerySchema } from './common.validators'

const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number')
  .max(20, 'Enter a valid phone number')
  .regex(/^\+?[0-9\s-]+$/, 'Enter a valid phone number')

const emailSchema = z.string().trim().min(1, 'Email is required').email('Enter a valid email address')

const PICKUP_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
const PAYMENT_METHODS = ['Mobile Money', 'Bank Transfer'] as const
const FARMER_STATUSES = ['Active', 'Inactive'] as const

const gpsCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

const bankDetailsSchema = z.object({
  bankName: z.string().trim().min(1, 'Bank name is required'),
  accountNumber: z.string().trim().min(1, 'Account number is required'),
  accountName: z.string().trim().min(1, 'Account name is required'),
})

const mobileMoneyDetailsSchema = z.object({
  provider: z.string().trim().min(1, 'Mobile money provider is required'),
  phoneNumber: phoneSchema,
})

const farmerFieldsSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: phoneSchema,
  alternativePhone: phoneSchema.optional(),
  email: emailSchema,
  nationalId: z.string().trim().min(1).optional(),
  farmName: z.string().trim().min(1, 'Farm name is required'),
  farmLocation: z.string().trim().min(1, 'Farm location is required'),
  district: z.string().trim().min(1, 'District is required'),
  region: z.string().trim().min(1, 'Region is required'),
  gpsCoordinates: gpsCoordinatesSchema.optional(),
  primaryCrops: z.array(z.string().trim().min(1)).min(1, 'At least one primary crop is required'),
  // No `.default([])` here on purpose: under `.partial()` (used by
  // updateFarmerSchema below), a Zod default fires for any *omitted* key
  // regardless of partial-ness, which would silently reintroduce
  // `preferredPickupDays: []` into every PATCH and wipe out whatever the
  // farmer had actually set. `createFarmerSchema` applies its own default
  // via `.extend(...)` instead, scoped to creation only.
  preferredPickupDays: z.array(z.enum(PICKUP_DAYS)).optional(),
  preferredPaymentMethod: z.enum(PAYMENT_METHODS),
  bankDetails: bankDetailsSchema.optional(),
  mobileMoneyDetails: mobileMoneyDetailsSchema.optional(),
  notes: z.string().trim().optional(),
})

/** Cross-field rule: the payment details matching the chosen method must be present. */
function requireMatchingPaymentDetails<T extends { preferredPaymentMethod: string; bankDetails?: unknown; mobileMoneyDetails?: unknown }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  if (data.preferredPaymentMethod === 'Bank Transfer' && !data.bankDetails) {
    ctx.addIssue({ code: 'custom', path: ['bankDetails'], message: 'Bank details are required when the payment method is Bank Transfer' })
  }
  if (data.preferredPaymentMethod === 'Mobile Money' && !data.mobileMoneyDetails) {
    ctx.addIssue({
      code: 'custom',
      path: ['mobileMoneyDetails'],
      message: 'Mobile money details are required when the payment method is Mobile Money',
    })
  }
}

export const createFarmerSchema = farmerFieldsSchema
  .extend({ preferredPickupDays: z.array(z.enum(PICKUP_DAYS)).optional().default([]) })
  .superRefine(requireMatchingPaymentDetails)

// Partial for PATCH — `farmerNumber`, `userId`, and `status` are deliberately
// absent (immutable / changed only via the dedicated /status endpoint), and
// `.strict()` rejects any attempt to sneak them in via the request body.
export const updateFarmerSchema = farmerFieldsSchema.partial().strict()

export const updateFarmerStatusSchema = z.object({
  status: z.enum(FARMER_STATUSES),
})

export const farmerListQuerySchema = listQuerySchema.extend({
  status: z.enum(FARMER_STATUSES).optional(),
  region: z.string().trim().optional(),
  district: z.string().trim().optional(),
  primaryCrop: z.string().trim().optional(),
})

export type CreateFarmerInput = z.infer<typeof createFarmerSchema>
export type UpdateFarmerInput = z.infer<typeof updateFarmerSchema>
export type UpdateFarmerStatusInput = z.infer<typeof updateFarmerStatusSchema>
export type FarmerListQuery = z.infer<typeof farmerListQuerySchema>
