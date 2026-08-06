import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createFarmerRecord, createPickupRecord, createStorageRequestRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['pickups.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/pickups', () => {
  it('lists every pickup for an Operations user', async () => {
    await createPickupRecord()
    await createPickupRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/pickups').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('scopes a farmer to only their own pickups', async () => {
    const { farmer, user } = await createFarmerRecord()
    const { request: ownSr } = await createStorageRequestRecord({ farmerId: farmer._id, status: 'Approved' })
    await createPickupRecord({ storageRequestId: ownSr._id })
    await createPickupRecord() // another farmer's pickup

    const token = await loginAndGetToken(user.email, DEFAULT_TEST_PASSWORD)
    const res = await request(testApp).get('/api/v1/pickups').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].farmerId).toBe(farmer._id.toString())
  })

  it('searches by pickup number', async () => {
    const { pickup } = await createPickupRecord({ pickupNumber: 'PU-77001' })
    await createPickupRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/pickups').query({ search: 'PU-77001' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).toBe(pickup._id.toString())
  })

  it('filters by status', async () => {
    await createPickupRecord({ status: 'Pending' })
    await createPickupRecord({ status: 'Scheduled' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/pickups').query({ status: 'Scheduled' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].status).toBe('Scheduled')
  })

  it('filters by scheduledDateFrom/scheduledDateTo', async () => {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const far = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await createPickupRecord({ status: 'Scheduled', scheduledDate: soon })
    await createPickupRecord({ status: 'Scheduled', scheduledDate: far })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .get('/api/v1/pickups')
      .query({ scheduledDateFrom: new Date(Date.now()).toISOString(), scheduledDateTo: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() })
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('filters by scheduledDateFrom alone', async () => {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const far = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await createPickupRecord({ status: 'Scheduled', scheduledDate: soon })
    await createPickupRecord({ status: 'Scheduled', scheduledDate: far })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .get('/api/v1/pickups')
      .query({ scheduledDateFrom: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() })
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).not.toBeUndefined()
  })

  it('filters by scheduledDateTo alone', async () => {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const far = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await createPickupRecord({ status: 'Scheduled', scheduledDate: soon })
    await createPickupRecord({ status: 'Scheduled', scheduledDate: far })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .get('/api/v1/pickups')
      .query({ scheduledDateTo: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() })
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('paginates results', async () => {
    await createPickupRecord()
    await createPickupRecord()
    await createPickupRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/pickups').query({ page: 1, pageSize: 2 }).set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.total).toBe(3)
    expect(res.body.meta.totalPages).toBe(2)
  })

  it('rejects a caller with no pickups.manage permission and no linked farmer profile', async () => {
    const token = await loginAsOperations([])

    const res = await request(testApp).get('/api/v1/pickups').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/pickups')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/pickups/:id', () => {
  it('allows an Operations user to view any pickup', async () => {
    const { pickup } = await createPickupRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/pickups/${pickup._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(pickup._id.toString())
  })

  it('allows the owning farmer to view their pickup', async () => {
    const { pickup, user } = await createPickupRecord()
    const token = await loginAndGetToken(user.email, DEFAULT_TEST_PASSWORD)

    const res = await request(testApp).get(`/api/v1/pickups/${pickup._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('rejects a farmer viewing another farmer’s pickup', async () => {
    const { pickup } = await createPickupRecord()
    const { user: otherUser } = await createFarmerRecord()
    const token = await loginAndGetToken(otherUser.email, DEFAULT_TEST_PASSWORD)

    const res = await request(testApp).get(`/api/v1/pickups/${pickup._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/pickups/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
