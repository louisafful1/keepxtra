import type { NotificationCategory, NotificationChannel } from '../models/notification.model'

export interface NotificationDto {
  id: string
  userId: string
  category: NotificationCategory
  channel: NotificationChannel
  title: string
  message: string
  isRead: boolean
  readAt: Date | null
  relatedEntityType: string | null
  relatedEntityId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UnreadCountDto {
  count: number
}

export interface NotificationPreferenceDto {
  id: string
  userId: string
  inAppEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  whatsappEnabled: boolean
  pushEnabled: boolean
  mutedCategories: NotificationCategory[]
  createdAt: Date
  updatedAt: Date
}
