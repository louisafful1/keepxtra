import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'

export type NotificationCategory =
  | 'Storage Request'
  | 'Pickup'
  | 'Inventory'
  | 'Quality Inspection'
  | 'Fleet'
  | 'Sales'
  | 'Payment'
  | 'System'

/**
 * `channel` records *intent* only — "persist only, no external
 * integrations now" per the spec. Every other module's event listeners
 * currently log a mock "notification event created" line rather than
 * calling this service (they were built before this module existed);
 * wiring them through here is a natural follow-up, deliberately left
 * undone in this phase so as not to touch already-verified modules.
 */
export type NotificationChannel = 'In-App' | 'Email' | 'SMS' | 'WhatsApp' | 'Push'

export interface INotification extends Document {
  userId: Types.ObjectId
  category: NotificationCategory
  channel: NotificationChannel
  title: string
  message: string
  isRead: boolean
  readAt: Date | null
  relatedEntityType: string | null
  relatedEntityId: string | null

  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

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

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    channel: { type: String, enum: ['In-App', 'Email', 'SMS', 'WhatsApp', 'Push'], default: 'In-App' },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    relatedEntityType: { type: String, default: null, trim: true },
    relatedEntityId: { type: String, default: null, trim: true },
  },
  { timestamps: true },
)

notificationSchema.plugin(auditablePlugin)

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, category: 1 })

export const Notification = model<INotification>('Notification', notificationSchema)
