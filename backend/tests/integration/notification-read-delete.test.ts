import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createNotificationRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

describe('PATCH /api/v1/notifications/:id/read', () => {
  it('marks the owning user\'s notification as read', async () => {
    const { user } = await createActiveUser({ email: 'owner@keepxtra.com' })
    const { notification } = await createNotificationRecord({ userId: user._id, isRead: false })
    const token = await loginAndGetToken('owner@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const res = await request(testApp).patch(`/api/v1/notifications/${notification._id.toString()}/read`).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.isRead).toBe(true)
    expect(res.body.data.readAt).not.toBeNull()
  })

  it('is idempotent on an already-read notification', async () => {
    const { user } = await createActiveUser({ email: 'owner2@keepxtra.com' })
    const { notification } = await createNotificationRecord({ userId: user._id, isRead: true, readAt: new Date('2026-01-01') })
    const token = await loginAndGetToken('owner2@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const res = await request(testApp).patch(`/api/v1/notifications/${notification._id.toString()}/read`).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(new Date(res.body.data.readAt).toISOString()).toBe(new Date('2026-01-01').toISOString())
  })

  it('rejects marking another user\'s notification as read', async () => {
    const { notification } = await createNotificationRecord()
    await createActiveUser({ email: 'intruder@keepxtra.com' })
    const token = await loginAndGetToken('intruder@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const res = await request(testApp).patch(`/api/v1/notifications/${notification._id.toString()}/read`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    await createActiveUser({ email: 'someone@keepxtra.com' })
    const token = await loginAndGetToken('someone@keepxtra.com', DEFAULT_TEST_PASSWORD)
    const res = await request(testApp).patch('/api/v1/notifications/665f1a2b3c4d5e6f7a8b9c0d/read').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/notifications/read-all', () => {
  it('marks every unread notification of the caller as read, leaving others untouched', async () => {
    const { user } = await createActiveUser({ email: 'bulk@keepxtra.com' })
    await createNotificationRecord({ userId: user._id, isRead: false })
    await createNotificationRecord({ userId: user._id, isRead: false })
    await createNotificationRecord({ userId: user._id, isRead: true })
    await createNotificationRecord({ isRead: false })

    const token = await loginAndGetToken('bulk@keepxtra.com', DEFAULT_TEST_PASSWORD)
    const res = await request(testApp).patch('/api/v1/notifications/read-all').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.updated).toBe(2)

    const unreadCountRes = await request(testApp).get('/api/v1/notifications/unread-count').set('Authorization', `Bearer ${token}`)
    expect(unreadCountRes.body.data.count).toBe(0)
  })
})

describe('DELETE /api/v1/notifications/:id', () => {
  it("soft-deletes the owning user's notification", async () => {
    const { user } = await createActiveUser({ email: 'deleter@keepxtra.com' })
    const { notification } = await createNotificationRecord({ userId: user._id })
    const token = await loginAndGetToken('deleter@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const res = await request(testApp).delete(`/api/v1/notifications/${notification._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)

    const listRes = await request(testApp).get('/api/v1/notifications').set('Authorization', `Bearer ${token}`)
    expect(listRes.body.meta.total).toBe(0)
  })

  it("rejects deleting another user's notification", async () => {
    const { notification } = await createNotificationRecord()
    await createActiveUser({ email: 'intruder2@keepxtra.com' })
    const token = await loginAndGetToken('intruder2@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const res = await request(testApp).delete(`/api/v1/notifications/${notification._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})
