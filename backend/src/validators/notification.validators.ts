import { z } from 'zod'
import { listQuerySchema } from './common.validators'

export const NOTIFICATION_CATEGORIES = [
  'Storage Request',
  'Pickup',
  'Inventory',
  'Quality Inspection',
  'Fleet',
  'Sales',
  'Payment',
  'System',
] as const
const NOTIFICATION_CHANNELS = ['In-App', 'Email', 'SMS', 'WhatsApp', 'Push'] as const

export const sendNotificationSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user id format'),
  category: z.enum(NOTIFICATION_CATEGORIES),
  channel: z.enum(NOTIFICATION_CHANNELS).optional(),
  title: z.string().trim().min(1, 'A title is required').max(200),
  message: z.string().trim().min(1, 'A message is required').max(2000),
  relatedEntityType: z.string().trim().min(1).optional(),
  relatedEntityId: z.string().trim().min(1).optional(),
})

export const notificationListQuerySchema = listQuerySchema.extend({
  category: z.enum(NOTIFICATION_CATEGORIES).optional(),
  // `z.coerce.boolean()` would map the string "false" to `true` (any
  // non-empty string is truthy) — an actual tri-state filter needs an
  // explicit string-to-boolean mapping instead.
  isRead: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
})

export const updateNotificationPreferencesSchema = z
  .object({
    inAppEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
    whatsappEnabled: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    mutedCategories: z.array(z.enum(NOTIFICATION_CATEGORIES)).optional(),
  })
  .strict()

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>
