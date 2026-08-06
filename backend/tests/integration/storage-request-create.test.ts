import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createFarmerRecord, createStorageRequestRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

function isoDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    produceType: 'Maize',
    quantity: 500,
    unit: 'kg',
    estimatedWeightKg: 500,
    harvestDate: isoDate(-3),
    pickupLocation: 'Farm Gate',
    preferredPickupDate: isoDate(2),
    preferredPickupTime: '08:00',
    ...overrides,
  }
}

async function loginAsFarmer() {
  const { farmer, user } = await createFarmerRecord()
  const token = await loginAndGetToken(user.email, DEFAULT_TEST_PASSWORD)
  return { farmer, user, token }
}

async function loginAsOperations(permissionKeys: string[] = ['storage-requests.read']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('POST /api/v1/storage-requests', () => {
  it('creates a Draft storage request for the calling farmer', async () => {
    const { farmer, token } = await loginAsFarmer()

    const res = await request(testApp).post('/api/v1/storage-requests').set('Authorization', `Bearer ${token}`).send(validPayload())

    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('Draft')
    expect(res.body.data.requestNumber).toMatch(/^SR-\d{5}$/)
    expect(res.body.data.farmerId).toBe(farmer._id.toString())
    expect(res.body.data.farmerName).toBe(`${farmer.firstName} ${farmer.lastName}`)
    expect(res.body.data.farmerNumber).toBe(farmer.farmerNumber)
    expect(res.body.data.district).toBe(farmer.district)
    expect(res.body.data.region).toBe(farmer.region)
    expect(res.body.data.requestedAt).toBeNull()
  })

  it('generates sequential request numbers', async () => {
    const { token } = await loginAsFarmer()

    const first = await request(testApp)
      .post('/api/v1/storage-requests')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ produceType: 'Tomatoes' }))
    const second = await request(testApp)
      .post('/api/v1/storage-requests')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ produceType: 'Cassava' }))

    const firstNum = Number((first.body.data.requestNumber as string).split('-')[1])
    const secondNum = Number((second.body.data.requestNumber as string).split('-')[1])
    expect(secondNum).toBe(firstNum + 1)
  })

  it('writes a "Storage Request Created" audit log entry', async () => {
    const { token } = await loginAsFarmer()

    const res = await request(testApp).post('/api/v1/storage-requests').set('Authorization', `Bearer ${token}`).send(validPayload())

    const entries = await AuditLog.find({ entityType: 'StorageRequest', entityId: res.body.data.id }).exec()
    expect(entries).toHaveLength(1)
    expect(entries[0]!.action).toBe('Storage Request Created')
  })

  it('rejects a second active request for the same produce + harvest date', async () => {
    const { farmer, token } = await loginAsFarmer()
    await createStorageRequestRecord({ farmerId: farmer._id, produceType: 'Maize', harvestDate: new Date(isoDate(-3)) })

    const res = await request(testApp).post('/api/v1/storage-requests').set('Authorization', `Bearer ${token}`).send(validPayload())

    expect(res.status).toBe(409)
  })

  it('allows a new request for the same produce once the prior one is terminal', async () => {
    const { farmer, token } = await loginAsFarmer()
    await createStorageRequestRecord({
      farmerId: farmer._id,
      produceType: 'Maize',
      harvestDate: new Date(isoDate(-3)),
      status: 'Rejected',
    })

    const res = await request(testApp).post('/api/v1/storage-requests').set('Authorization', `Bearer ${token}`).send(validPayload())

    expect(res.status).toBe(201)
  })

  it('rejects a caller with no linked farmer profile', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/storage-requests').set('Authorization', `Bearer ${token}`).send(validPayload())
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).post('/api/v1/storage-requests').send(validPayload())
    expect(res.status).toBe(401)
  })

  it('rejects a quantity of 0', async () => {
    const { token } = await loginAsFarmer()
    const res = await request(testApp)
      .post('/api/v1/storage-requests')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ quantity: 0 }))
    expect(res.status).toBe(422)
  })

  it('rejects a harvest date in the future', async () => {
    const { token } = await loginAsFarmer()
    const res = await request(testApp)
      .post('/api/v1/storage-requests')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ harvestDate: isoDate(5) }))
    expect(res.status).toBe(422)
  })

  it('rejects a preferred pickup date before the harvest date', async () => {
    const { token } = await loginAsFarmer()
    const res = await request(testApp)
      .post('/api/v1/storage-requests')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ harvestDate: isoDate(-1), preferredPickupDate: isoDate(-5) }))
    expect(res.status).toBe(422)
  })

  it('rejects invalid GPS coordinates', async () => {
    const { token } = await loginAsFarmer()
    const res = await request(testApp)
      .post('/api/v1/storage-requests')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ gpsCoordinates: { lat: 999, lng: 10 } }))
    expect(res.status).toBe(422)
  })

  it('rejects a malformed preferred pickup time', async () => {
    const { token } = await loginAsFarmer()
    const res = await request(testApp)
      .post('/api/v1/storage-requests')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ preferredPickupTime: '8am' }))
    expect(res.status).toBe(422)
  })

  it('rejects a non-URL photo entry', async () => {
    const { token } = await loginAsFarmer()
    const res = await request(testApp)
      .post('/api/v1/storage-requests')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ photos: ['not-a-url'] }))
    expect(res.status).toBe(422)
  })

  it('accepts a request with no photos (optional)', async () => {
    const { token } = await loginAsFarmer()
    const res = await request(testApp).post('/api/v1/storage-requests').set('Authorization', `Bearer ${token}`).send(validPayload())
    expect(res.status).toBe(201)
    expect(res.body.data.photos).toEqual([])
  })

  it('accepts a request with valid photo URLs', async () => {
    const { token } = await loginAsFarmer()
    const res = await request(testApp)
      .post('/api/v1/storage-requests')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ photos: ['https://example.com/photo1.jpg'] }))
    expect(res.status).toBe(201)
    expect(res.body.data.photos).toEqual(['https://example.com/photo1.jpg'])
  })
})
