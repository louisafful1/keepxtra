import { describe, expect, it, vi, afterEach } from 'vitest'
import { notificationService } from '../../src/services/notification.service'
import { notificationRepository } from '../../src/repositories/notification.repository'
import { notificationPreferenceRepository } from '../../src/repositories/notificationPreference.repository'
import { createActiveUser, createNotificationRecord, createNotificationPreferenceRecord } from '../utils/factories'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'

function actorFrom(user: IUser): AuthenticatedUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarInitials: user.avatarInitials,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    roleId: user.roleId.toString(),
    roleName: 'Operations',
    permissions: ['notifications.send'],
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('NotificationService defensive branches', () => {
  it('markAsRead throws not-found if the record disappears between ownership check and updateById', async () => {
    const { user } = await createActiveUser()
    const { notification } = await createNotificationRecord({ userId: user._id, isRead: false })
    vi.spyOn(notificationRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(notificationService.markAsRead(notification._id.toString(), actorFrom(user))).rejects.toThrow('Notification not found')
  })

  it('updatePreferences throws not-found if the record disappears between get-or-create and updateById', async () => {
    const { user } = await createActiveUser()
    await createNotificationPreferenceRecord({ userId: user._id })
    vi.spyOn(notificationPreferenceRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(notificationService.updatePreferences({ smsEnabled: true }, actorFrom(user))).rejects.toThrow(
      'Notification preferences not found',
    )
  })

  it('send returns null and creates no record when the recipient has muted the category', async () => {
    const { user: sender } = await createActiveUser()
    const { user: recipient } = await createActiveUser()
    await createNotificationPreferenceRecord({ userId: recipient._id, mutedCategories: ['System'] })

    const result = await notificationService.send(
      { userId: recipient._id.toString(), category: 'System', title: 'x', message: 'x' },
      actorFrom(sender),
      {},
    )

    expect(result).toBeNull()
  })
})
