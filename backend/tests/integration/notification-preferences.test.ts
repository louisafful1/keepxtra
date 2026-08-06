import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createNotificationPreferenceRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

describe('GET /api/v1/notifications/preferences', () => {
  it('lazily creates default preferences on first access', async () => {
    await createActiveUser({ email: 'newuser@keepxtra.com' })
    const token = await loginAndGetToken('newuser@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const res = await request(testApp).get('/api/v1/notifications/preferences').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.inAppEnabled).toBe(true)
    expect(res.body.data.emailEnabled).toBe(true)
    expect(res.body.data.mutedCategories).toEqual([])
  })

  it('returns the same preferences on repeated access rather than creating duplicates', async () => {
    await createActiveUser({ email: 'repeat@keepxtra.com' })
    const token = await loginAndGetToken('repeat@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const first = await request(testApp).get('/api/v1/notifications/preferences').set('Authorization', `Bearer ${token}`)
    const second = await request(testApp).get('/api/v1/notifications/preferences').set('Authorization', `Bearer ${token}`)

    expect(first.body.data.id).toBe(second.body.data.id)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/notifications/preferences')
    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/v1/notifications/preferences', () => {
  it('updates the caller\'s preferences', async () => {
    const { user } = await createActiveUser({ email: 'updater@keepxtra.com' })
    await createNotificationPreferenceRecord({ userId: user._id })
    const token = await loginAndGetToken('updater@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const res = await request(testApp)
      .patch('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ smsEnabled: true, mutedCategories: ['Sales', 'Fleet'] })

    expect(res.status).toBe(200)
    expect(res.body.data.smsEnabled).toBe(true)
    expect(res.body.data.mutedCategories).toEqual(['Sales', 'Fleet'])
    expect(res.body.data.emailEnabled).toBe(true)
  })

  it('lazily creates preferences before updating if none exist yet', async () => {
    await createActiveUser({ email: 'firstupdate@keepxtra.com' })
    const token = await loginAndGetToken('firstupdate@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const res = await request(testApp).patch('/api/v1/notifications/preferences').set('Authorization', `Bearer ${token}`).send({ pushEnabled: true })

    expect(res.status).toBe(200)
    expect(res.body.data.pushEnabled).toBe(true)
  })

  it('rejects an unknown field', async () => {
    await createActiveUser({ email: 'strict@keepxtra.com' })
    const token = await loginAndGetToken('strict@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const res = await request(testApp)
      .patch('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ notARealField: true })

    expect(res.status).toBe(422)
  })
})
