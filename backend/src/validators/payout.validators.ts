import { z } from 'zod'
import { listQuerySchema } from './common.validators'

const PAYOUT_STATUSES = ['Pending', 'Approved', 'Paid', 'Rejected'] as const
const PAYOUT_METHODS = ['Bank Transfer', 'Mobile Money'] as const

export const processPayoutSchema = z.object({
  method: z.enum(PAYOUT_METHODS),
  transactionId: z.string().trim().min(1, 'A transaction id is required'),
})

export const rejectPayoutSchema = z.object({
  reason: z.string().trim().min(1, 'A rejection reason is required'),
})

export const payoutListQuerySchema = listQuerySchema.extend({
  status: z.enum(PAYOUT_STATUSES).optional(),
  farmerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid farmer id format').optional(),
  method: z.enum(PAYOUT_METHODS).optional(),
})

export type ProcessPayoutInput = z.infer<typeof processPayoutSchema>
export type RejectPayoutInput = z.infer<typeof rejectPayoutSchema>
export type PayoutListQuery = z.infer<typeof payoutListQuerySchema>
