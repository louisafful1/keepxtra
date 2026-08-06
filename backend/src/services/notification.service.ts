import { notificationRepository } from '../repositories/notification.repository'
import { notificationPreferenceRepository } from '../repositories/notificationPreference.repository'
import { auditService } from './audit.service'
import { toObjectId } from '../utils/mongoose'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import type { INotification } from '../models/notification.model'
import type { INotificationPreference } from '../models/notificationPreference.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { NotificationDto, NotificationPreferenceDto, UnreadCountDto } from '../types/notification.dto'
import type { NotificationListQuery, SendNotificationInput, UpdateNotificationPreferencesInput } from '../validators/notification.validators'

export interface RequestMeta {
  ip?: string | null
}

function toDto(notification: INotification): NotificationDto {
  return {
    id: notification._id.toString(),
    userId: notification.userId.toString(),
    category: notification.category,
    channel: notification.channel,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    readAt: notification.readAt,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  }
}

function toPreferenceDto(preference: INotificationPreference): NotificationPreferenceDto {
  return {
    id: preference._id.toString(),
    userId: preference.userId.toString(),
    inAppEnabled: preference.inAppEnabled,
    emailEnabled: preference.emailEnabled,
    smsEnabled: preference.smsEnabled,
    whatsappEnabled: preference.whatsappEnabled,
    pushEnabled: preference.pushEnabled,
    mutedCategories: preference.mutedCategories,
    createdAt: preference.createdAt,
    updatedAt: preference.updatedAt,
  }
}

async function getOrCreatePreference(userId: string): Promise<INotificationPreference> {
  const existing = await notificationPreferenceRepository.findByUserId(userId)
  if (existing) return existing
  return notificationPreferenceRepository.create({ userId: toObjectId(userId) })
}

/**
 * Every module's event listeners currently only log a mock "would have
 * notified" line (see e.g. `payoutNotifications.listener.ts`) rather than
 * calling this — wiring them through is a deliberate follow-up left
 * undone so as not to touch already-verified modules. This is therefore
 * reachable today only via the `notifications.send` HTTP endpoint, but is
 * built as the real persistence layer those listeners will eventually
 * call into.
 */
async function send(input: SendNotificationInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<NotificationDto | null> {
  const preference = await getOrCreatePreference(input.userId)
  if (preference.mutedCategories.includes(input.category)) return null

  const notification = await notificationRepository.create({
    userId: toObjectId(input.userId),
    category: input.category,
    channel: input.channel ?? 'In-App',
    title: input.title,
    message: input.message,
    relatedEntityType: input.relatedEntityType ?? null,
    relatedEntityId: input.relatedEntityId ?? null,
    createdBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Notification Sent',
    entityType: 'Notification',
    entityId: notification._id.toString(),
    affectedRecord: `${notification.title} (${notification.category})`,
    newValue: `To user ${input.userId}`,
    ip: meta.ip,
  })

  return toDto(notification)
}

async function list(actor: AuthenticatedUser, query: NotificationListQuery): Promise<{ data: NotificationDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)
  const filter = buildFilterQuery<INotification>({
    search: query,
    searchableFields: ['title', 'message'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { userId: actor.id, category: query.category, isRead: query.isRead },
  })
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    notificationRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    notificationRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function getUnreadCount(actor: AuthenticatedUser): Promise<UnreadCountDto> {
  const count = await notificationRepository.countUnread(actor.id)
  return { count }
}

async function assertOwned(id: string, actor: AuthenticatedUser): Promise<INotification> {
  const notification = await notificationRepository.findById(id)
  if (!notification) throw ApiError.notFound('Notification not found')
  if (notification.userId.toString() !== actor.id) throw ApiError.forbidden('You do not have access to this notification')
  return notification
}

async function markAsRead(id: string, actor: AuthenticatedUser): Promise<NotificationDto> {
  const notification = await assertOwned(id, actor)
  if (notification.isRead) return toDto(notification)

  const updated = await notificationRepository.updateById(id, { isRead: true, readAt: new Date(), updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Notification not found')
  return toDto(updated)
}

async function markAllAsRead(actor: AuthenticatedUser): Promise<{ updated: number }> {
  const updated = await notificationRepository.markAllAsRead(actor.id, new Date())
  return { updated }
}

async function remove(id: string, actor: AuthenticatedUser): Promise<void> {
  await assertOwned(id, actor)
  await notificationRepository.softDeleteById(id)
}

async function getPreferences(actor: AuthenticatedUser): Promise<NotificationPreferenceDto> {
  const preference = await getOrCreatePreference(actor.id)
  return toPreferenceDto(preference)
}

async function updatePreferences(input: UpdateNotificationPreferencesInput, actor: AuthenticatedUser): Promise<NotificationPreferenceDto> {
  const preference = await getOrCreatePreference(actor.id)
  const updated = await notificationPreferenceRepository.updateById(preference._id.toString(), {
    ...input,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Notification preferences not found')
  return toPreferenceDto(updated)
}

export const notificationService = {
  send,
  list,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  remove,
  getPreferences,
  updatePreferences,
}
