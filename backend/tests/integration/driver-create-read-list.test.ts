import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createDriverRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['drivers.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Kofi Mensah',
    phone: '+233 24 222 2222',
    licenseNumber: 'GHA-DL-00123',
    licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    ...overrides,
  }
}

describe('POST /api/v1/drivers', () => {
  it('creates a driver with an auto-generated code', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/drivers').set('Authorization', `Bearer ${token}`).send(validPayload())

    expect(res.status).toBe(201)
    expect(res.body.data.driverCode).toMatch(/^DR-\d{5}$/)
    expect(res.body.data.status).toBe('Available')
    expect(res.body.data.totalTripsCompleted).toBe(0)
    expect(res.body.data.isLicenseExpired).toBe(false)
  })

  it('writes a "Driver Created" audit log entry', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/drivers').set('Authorization', `Bearer ${token}`).send(validPayload())

    const entries = await AuditLog.find({ entityType: 'Driver', entityId: res.body.data.id, action: 'Driver Created' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects a duplicate licenseNumber', async () => {
    await createDriverRecord({ licenseNumber: 'GHA-DL-99999' })
    const token = await loginAsOperations()

    const res = await request(testApp).post('/api/v1/drivers').set('Authorization', `Bearer ${token}`).send(validPayload({ licenseNumber: 'GHA-DL-99999' }))
    expect(res.status).toBe(409)
  })

  it('rejects an incomplete payload', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/drivers').set('Authorization', `Bearer ${token}`).send({ name: 'X' })
    expect(res.status).toBe(422)
  })

  it('rejects a caller without drivers.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).post('/api/v1/drivers').set('Authorization', `Bearer ${token}`).send(validPayload())
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).post('/api/v1/drivers').send(validPayload())
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/drivers', () => {
  it('lists every driver', async () => {
    await createDriverRecord()
    await createDriverRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/drivers').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('searches by name', async () => {
    const driver = await createDriverRecord({ name: 'Yaw Boateng' })
    await createDriverRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/drivers').query({ search: 'Yaw Boateng' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).toBe(driver._id.toString())
  })

  it('filters by status', async () => {
    await createDriverRecord({ status: 'Available' })
    await createDriverRecord({ status: 'Suspended' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/drivers').query({ status: 'Suspended' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('rejects a caller without drivers.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/drivers').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})

describe('GET /api/v1/drivers/:id', () => {
  it('returns the driver, flagging an expired license', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const driver = await createDriverRecord({ licenseExpiryDate: yesterday })
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/drivers/${driver._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.isLicenseExpired).toBe(true)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/drivers/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
