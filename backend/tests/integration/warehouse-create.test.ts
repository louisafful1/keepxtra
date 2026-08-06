import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['warehouses.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Nsawam Cold Store',
    location: 'Plot 12, Industrial Area',
    district: 'Nsawam-Adoagyiri',
    region: 'Eastern',
    totalCapacityKg: 50000,
    ...overrides,
  }
}

describe('POST /api/v1/warehouses', () => {
  it('creates a warehouse with an auto-generated code', async () => {
    const token = await loginAsOperations()

    const res = await request(testApp).post('/api/v1/warehouses').set('Authorization', `Bearer ${token}`).send(validPayload())

    expect(res.status).toBe(201)
    expect(res.body.data.warehouseCode).toMatch(/^WH-\d{5}$/)
    expect(res.body.data.status).toBe('Active')
    expect(res.body.data.currentOccupancyKg).toBe(0)
    expect(res.body.data.zones).toEqual([])
  })

  it('creates a warehouse with zones and derives currentOccupancyKg from them', async () => {
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/warehouses')
      .set('Authorization', `Bearer ${token}`)
      .send(
        validPayload({
          zones: [
            { name: 'Zone A', capacityKg: 20000, currentOccupancyKg: 5000 },
            { name: 'Zone B', capacityKg: 20000, currentOccupancyKg: 1000 },
          ],
        }),
      )

    expect(res.status).toBe(201)
    expect(res.body.data.zones).toHaveLength(2)
    expect(res.body.data.currentOccupancyKg).toBe(6000)
  })

  it('writes a "Warehouse Created" audit log entry', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/warehouses').set('Authorization', `Bearer ${token}`).send(validPayload())

    const entries = await AuditLog.find({ entityType: 'Warehouse', entityId: res.body.data.id, action: 'Warehouse Created' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('defaults a zone’s currentOccupancyKg to 0 when omitted', async () => {
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/warehouses')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ zones: [{ name: 'Zone A', capacityKg: 10000 }] }))

    expect(res.status).toBe(201)
    expect(res.body.data.zones[0].currentOccupancyKg).toBe(0)
    expect(res.body.data.currentOccupancyKg).toBe(0)
  })

  it('rejects a zone occupied beyond its own capacity', async () => {
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/warehouses')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ totalCapacityKg: 50000, zones: [{ name: 'Zone A', capacityKg: 1000, currentOccupancyKg: 2000 }] }))
    expect(res.status).toBe(409)
  })

  it('rejects zone capacities that exceed the total capacity', async () => {
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/warehouses')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ totalCapacityKg: 10000, zones: [{ name: 'Zone A', capacityKg: 6000 }, { name: 'Zone B', capacityKg: 6000 }] }))

    expect(res.status).toBe(422)
  })

  it('rejects a non-positive totalCapacityKg', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/warehouses').set('Authorization', `Bearer ${token}`).send(validPayload({ totalCapacityKg: 0 }))
    expect(res.status).toBe(422)
  })

  it('rejects an incomplete payload', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/warehouses').set('Authorization', `Bearer ${token}`).send({ name: 'X' })
    expect(res.status).toBe(422)
  })

  it('rejects a caller without warehouses.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).post('/api/v1/warehouses').set('Authorization', `Bearer ${token}`).send(validPayload())
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).post('/api/v1/warehouses').send(validPayload())
    expect(res.status).toBe(401)
  })
})
