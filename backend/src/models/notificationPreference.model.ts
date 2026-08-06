import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'
import type { NotificationCategory } from './notification.model'

const CATEGORIES: NotificationCategory[] = [
  'Storage Request',
  'Pickup',
  'Inventory',
  'Quality Inspection',
  'Fleet',
  'Sales',
  'Payment',
  'System',
]

export interface INotificationPreference extends Document {
  userId: Types.ObjectId
  inAppEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  whatsappEnabled: boolean
  pushEnabled: boolean
  /** Categories the user has muted — a muted category is never delivered, regardless of channel toggles. */
  mutedCategories: NotificationCategory[]

  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    inAppEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    whatsappEnabled: { type: Boolean, default: false },
    pushEnabled: { type: Boolean, default: false },
    mutedCategories: { type: [String], enum: CATEGORIES, default: [] },
  },
  { timestamps: true },
)

notificationPreferenceSchema.plugin(auditablePlugin)

export const NotificationPreference = model<INotificationPreference>('NotificationPreference', notificationPreferenceSchema)
