import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createFarmerRecord, createStorageRequestRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsFarmer() {
  const { farmer, user } = await createFarmerRecord()
  const token = await loginAndGetToken(user.email, DEFAULT_TEST_PASSWORD)
  return { farmer, user, token }
}

async function loginAsOperations(permissionKeys: string[] = ['storage-requests.read']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/storage-requests/:id', () => {
  it('returns the request for an Operations user with storage-requests.read', async () => {
    const { request: sr } = await createStorageRequestRecord({ produceType: 'Cocoa' })
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/storage-requests/${sr._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.produceType).toBe('Cocoa')
  })

  it('allows the owning farmer to view their own request without any permission', async () => {
    const { farmer, token } = await loginAsFarmer()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id })

    const res = await request(testApp).get(`/api/v1/storage-requests/${sr._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('forbids a farmer from viewing another farmer’s request', async () => {
    const { request: sr } = await createStorageRequestRecord()
    const { token } = await loginAsFarmer()

    const res = await request(testApp).get(`/api/v1/storage-requests/${sr._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/storage-requests/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const { request: sr } = await createStorageRequestRecord()
    const res = await request(testApp).get(`/api/v1/storage-requests/${sr._id.toString()}`)
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/storage-requests', () => {
  it('lets an Operations user see every request', async () => {
    await createStorageRequestRecord()
    await createStorageRequestRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/storage-requests').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('auto-scopes a farmer to only their own requests', async () => {
    const { farmer, token } = await loginAsFarmer()
    await createStorageRequestRecord({ farmerId: farmer._id })
    await createStorageRequestRecord() // someone else's

    const res = await request(testApp).get('/api/v1/storage-requests').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].farmerId).toBe(farmer._id.toString())
  })

  it('paginates results', async () => {
    for (let i = 0; i < 5; i += 1) {
      await createStorageRequestRecord({ produceType: `Crop${i}` })
    }
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/storage-requests?pageSize=2&page=2').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta).toMatchObject({ page: 2, pageSize: 2, total: 5, totalPages: 3 })
  })

  it('searches by request number, farmer name, farmer number, produce, district, and region', async () => {
    const { farmer } = await createFarmerRecord({ firstName: 'Yaw', lastName: 'Mensah' })
    const { request: sr } = await createStorageRequestRecord({
      farmerId: farmer._id,
      produceType: 'Cashew',
      district: 'Wa Municipal',
      region: 'Upper West',
    })
    await createStorageRequestRecord({ produceType: 'Yam', district: 'Somewhere Else', region: 'Northern' })
    const token = await loginAsOperations()

    const cases = [
      sr.requestNumber,
      sr.farmerName,
      sr.farmerNumber,
      'Cashew',
      'Wa Municipal',
      'Upper West',
    ]

    for (const value of cases) {
      const res = await request(testApp)
        .get(`/api/v1/storage-requests?search=${encodeURIComponent(value)}`)
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      const ids = (res.body.data as { id: string }[]).map((r) => r.id)
      expect(ids).toContain(sr._id.toString())
      expect(res.body.data).toHaveLength(1)
    }
  })

  it('filters by status', async () => {
    await createStorageRequestRecord({ status: 'Draft' })
    await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/storage-requests?status=Submitted').set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].status).toBe('Submitted')
  })

  it('filters by priority', async () => {
    await createStorageRequestRecord({ priority: 'Urgent' })
    await createStorageRequestRecord({ priority: 'Low' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/storage-requests?priority=Urgent').set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].priority).toBe('Urgent')
  })

  it('filters by produce type', async () => {
    await createStorageRequestRecord({ produceType: 'Plantain' })
    await createStorageRequestRecord({ produceType: 'Cassava' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/storage-requests?produceType=Plantain').set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(1)
  })

  it('filters by region', async () => {
    await createStorageRequestRecord({ region: 'Volta' })
    await createStorageRequestRecord({ region: 'Central' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/storage-requests?region=Volta').set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(1)
  })

  it('filters by harvest date range', async () => {
    const oldHarvest = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await createStorageRequestRecord({ harvestDate: oldHarvest })
    await createStorageRequestRecord() // default: 3 days ago
    const token = await loginAsOperations()

    const from = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const res = await request(testApp).get(`/api/v1/storage-requests?harvestDateFrom=${from}`).set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(1)
  })

  it('filters by preferred pickup date range', async () => {
    const farAway = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await createStorageRequestRecord({ preferredPickupDate: farAway })
    await createStorageRequestRecord() // default: 2 days from now
    const token = await loginAsOperations()

    const to = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const res = await request(testApp).get(`/api/v1/storage-requests?pickupDateTo=${to}`).set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(1)
  })

  it('filters by harvest date range using the upper bound alone', async () => {
    const oldHarvest = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await createStorageRequestRecord({ harvestDate: oldHarvest })
    await createStorageRequestRecord() // default: 3 days ago
    const token = await loginAsOperations()

    const to = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const res = await request(testApp).get(`/api/v1/storage-requests?harvestDateTo=${to}`).set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(1)
  })

  it('filters by preferred pickup date range using the lower bound alone', async () => {
    const farAway = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await createStorageRequestRecord({ preferredPickupDate: farAway })
    await createStorageRequestRecord() // default: 2 days from now
    const token = await loginAsOperations()

    const from = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const res = await request(testApp).get(`/api/v1/storage-requests?pickupDateFrom=${from}`).set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(1)
  })

  it('sorts results', async () => {
    await createStorageRequestRecord({ quantity: 100 })
    await createStorageRequestRecord({ quantity: 900 })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/storage-requests?sortBy=quantity&sortDir=asc').set('Authorization', `Bearer ${token}`)
    expect(res.body.data[0].quantity).toBe(100)
    expect(res.body.data[1].quantity).toBe(900)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/storage-requests')
    expect(res.status).toBe(401)
  })
})
