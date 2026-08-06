import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createVehicleRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['fleet.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return { plateNumber: 'GT 1234-24', type: 'Refrigerated Truck', capacityKg: 5000, ...overrides }
}

describe('POST /api/v1/vehicles', () => {
  it('creates a vehicle with an auto-generated code', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/vehicles').set('Authorization', `Bearer ${token}`).send(validPayload())

    expect(res.status).toBe(201)
    expect(res.body.data.vehicleCode).toMatch(/^VH-\d{5}$/)
    expect(res.body.data.status).toBe('Available')
    expect(res.body.data.currentMileageKm).toBe(0)
  })

  it('writes a "Vehicle Created" audit log entry', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/vehicles').set('Authorization', `Bearer ${token}`).send(validPayload())

    const entries = await AuditLog.find({ entityType: 'Vehicle', entityId: res.body.data.id, action: 'Vehicle Created' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects a duplicate plateNumber', async () => {
    await createVehicleRecord({ plateNumber: 'GT 9999-24' })
    const token = await loginAsOperations()

    const res = await request(testApp).post('/api/v1/vehicles').set('Authorization', `Bearer ${token}`).send(validPayload({ plateNumber: 'GT 9999-24' }))
    expect(res.status).toBe(409)
  })

  it('rejects a non-positive capacityKg', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/vehicles').set('Authorization', `Bearer ${token}`).send(validPayload({ capacityKg: 0 }))
    expect(res.status).toBe(422)
  })

  it('rejects an incomplete payload', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/vehicles').set('Authorization', `Bearer ${token}`).send({ type: 'Van' })
    expect(res.status).toBe(422)
  })

  it('rejects a caller without fleet.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).post('/api/v1/vehicles').set('Authorization', `Bearer ${token}`).send(validPayload())
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).post('/api/v1/vehicles').send(validPayload())
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/vehicles', () => {
  it('lists every vehicle', async () => {
    await createVehicleRecord()
    await createVehicleRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/vehicles').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('searches by plate number', async () => {
    const vehicle = await createVehicleRecord({ plateNumber: 'GT 5555-24' })
    await createVehicleRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/vehicles').query({ search: 'GT 5555-24' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).toBe(vehicle._id.toString())
  })

  it('filters by status', async () => {
    await createVehicleRecord({ status: 'Available' })
    await createVehicleRecord({ status: 'Under Maintenance' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/vehicles').query({ status: 'Under Maintenance' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('paginates results', async () => {
    await createVehicleRecord()
    await createVehicleRecord()
    await createVehicleRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/vehicles').query({ page: 1, pageSize: 2 }).set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.totalPages).toBe(2)
  })

  it('rejects a caller without fleet.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/vehicles').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})

describe('GET /api/v1/vehicles/:id', () => {
  it('returns the vehicle', async () => {
    const vehicle = await createVehicleRecord({ plateNumber: 'GT 7777-24' })
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.plateNumber).toBe('GT 7777-24')
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/vehicles/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
