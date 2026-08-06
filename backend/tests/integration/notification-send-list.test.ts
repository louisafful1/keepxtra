import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createNotificationRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsSender(permissionKeys: string[] = ['notifications.send']) {
  const { user } = await createActiveUser({ email: 'sender@keepxtra.com', permissionKeys })
  const token = await loginAndGetToken('sender@keepxtra.com', DEFAULT_TEST_PASSWORD)
  return { user, token }
}

describe('POST /api/v1/notifications', () => {
  it('sends a notification to a user', async () => {
    const { user: recipient } = await createActiveUser({ email: 'recipient@keepxtra.com' })
    const { token } = await loginAsSender()

    const res = await request(testApp)
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: recipient._id.toString(), category: 'System', title: 'Welcome', message: 'Hello there' })

    expect(res.status).toBe(201)
    expect(res.body.data.userId).toBe(recipient._id.toString())
    expect(res.body.data.category).toBe('System')
    expect(res.body.data.isRead).toBe(false)
  })

  it('rejects a caller without notifications.send', async () => {
    const { user: recipient } = await createActiveUser({ email: 'recipient2@keepxtra.com' })
    const { token } = await loginAsSender([])

    const res = await request(testApp)
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: recipient._id.toString(), category: 'System', title: 'Welcome', message: 'Hello there' })

    expect(res.status).toBe(403)
  })

  it('rejects an invalid body', async () => {
    const { token } = await loginAsSender()
    const res = await request(testApp).post('/api/v1/notifications').set('Authorization', `Bearer ${token}`).send({ category: 'System' })
    expect(res.status).toBe(422)
  })

  it('skips creation silently when the recipient has muted the category', async () => {
    const { user: recipient } = await createActiveUser({ email: 'muted@keepxtra.com' })
    const { token: senderToken } = await loginAsSender()

    // Recipient mutes Payment via their own preferences endpoint.
    const recipientToken = await loginAndGetToken('muted@keepxtra.com', DEFAULT_TEST_PASSWORD)
    await request(testApp)
      .patch('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({ mutedCategories: ['Payment'] })

    const res = await request(testApp)
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ userId: recipient._id.toString(), category: 'Payment', title: 'Payout', message: 'Paid' })

    expect(res.status).toBe(200)
    expect(res.body.data).toBeNull()
  })
})

describe('GET /api/v1/notifications', () => {
  it('is self-scoped to the authenticated user', async () => {
    const { user } = await createActiveUser({ email: 'me@keepxtra.com' })
    await createNotificationRecord({ userId: user._id })
    await createNotificationRecord({ userId: user._id })
    await createNotificationRecord()

    const token = await loginAndGetToken('me@keepxtra.com', DEFAULT_TEST_PASSWORD)
    const res = await request(testApp).get('/api/v1/notifications').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('filters by category and isRead', async () => {
    const { user } = await createActiveUser({ email: 'me2@keepxtra.com' })
    await createNotificationRecord({ userId: user._id, category: 'Pickup', isRead: true })
    await createNotificationRecord({ userId: user._id, category: 'Payment', isRead: false })

    const token = await loginAndGetToken('me2@keepxtra.com', DEFAULT_TEST_PASSWORD)
    const res = await request(testApp)
      .get('/api/v1/notifications')
      .query({ category: 'Pickup' })
      .set('Authorization', `Bearer ${token}`)

    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].category).toBe('Pickup')

    const unreadRes = await request(testApp).get('/api/v1/notifications').query({ isRead: 'false' }).set('Authorization', `Bearer ${token}`)
    expect(unreadRes.body.meta.total).toBe(1)
    expect(unreadRes.body.data[0].category).toBe('Payment')
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/notifications')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/notifications/unread-count', () => {
  it('returns the count of unread notifications for the caller only', async () => {
    const { user } = await createActiveUser({ email: 'counter@keepxtra.com' })
    await createNotificationRecord({ userId: user._id, isRead: false })
    await createNotificationRecord({ userId: user._id, isRead: false })
    await createNotificationRecord({ userId: user._id, isRead: true })
    await createNotificationRecord({ isRead: false })

    const token = await loginAndGetToken('counter@keepxtra.com', DEFAULT_TEST_PASSWORD)
    const res = await request(testApp).get('/api/v1/notifications/unread-count').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.count).toBe(2)
  })
})
