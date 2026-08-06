import { describe, expect, it } from 'vitest'
import { Notification } from '../../src/models/notification.model'
import { NotificationPreference } from '../../src/models/notificationPreference.model'
import { createNotificationRecord, createNotificationPreferenceRecord } from '../utils/factories'

describe('Notification model constraints', () => {
  it('rejects an invalid category', async () => {
    const { notification } = await createNotificationRecord()
    await expect(
      Notification.create({
        userId: notification.userId,
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        category: 'Not A Real Category',
        title: 'Test',
        message: 'Test',
      }),
    ).rejects.toThrow()
  })

  it('rejects a missing title', async () => {
    const { notification } = await createNotificationRecord()
    await expect(
      Notification.create({
        userId: notification.userId,
        category: 'System',
        message: 'Test',
      }),
    ).rejects.toThrow()
  })

  it('defaults channel to In-App and isRead to false', async () => {
    const { notification } = await createNotificationRecord({ channel: undefined, isRead: undefined })
    expect(notification.channel).toBe('In-App')
    expect(notification.isRead).toBe(false)
  })
})

describe('NotificationPreference model constraints', () => {
  it('rejects a duplicate userId', async () => {
    const { preference } = await createNotificationPreferenceRecord()
    await expect(NotificationPreference.create({ userId: preference.userId })).rejects.toThrow()
  })

  it('defaults channel toggles', async () => {
    const { preference } = await createNotificationPreferenceRecord({
      inAppEnabled: undefined,
      emailEnabled: undefined,
      smsEnabled: undefined,
      whatsappEnabled: undefined,
      pushEnabled: undefined,
    })
    expect(preference.inAppEnabled).toBe(true)
    expect(preference.emailEnabled).toBe(true)
    expect(preference.smsEnabled).toBe(false)
    expect(preference.whatsappEnabled).toBe(false)
    expect(preference.pushEnabled).toBe(false)
    expect(preference.mutedCategories).toEqual([])
  })
})
