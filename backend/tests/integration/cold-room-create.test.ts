import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createWarehouseRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['warehouses.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

function validPayload(warehouseId: string, overrides: Record<string, unknown> = {}) {
  return {
    warehouseId,
    name: 'Cold Room 1',
    capacityKg: 8000,
    targetTemperatureMinC: 0,
    targetTemperatureMaxC: 4,
    targetHumidityMinPercent: 85,
    targetHumidityMaxPercent: 95,
    ...overrides,
  }
}

describe('POST /api/v1/cold-rooms', () => {
  it('creates a cold room with an auto-generated code, denormalized from its warehouse', async () => {
    const warehouse = await createWarehouseRecord({ name: 'Nsawam Cold Store' })
    const token = await loginAsOperations()

    const res = await request(testApp).post('/api/v1/cold-rooms').set('Authorization', `Bearer ${token}`).send(validPayload(warehouse._id.toString()))

    expect(res.status).toBe(201)
    expect(res.body.data.coldRoomCode).toMatch(/^CR-\d{5}$/)
    expect(res.body.data.warehouseCode).toBe(warehouse.warehouseCode)
    expect(res.body.data.warehouseName).toBe('Nsawam Cold Store')
    expect(res.body.data.status).toBe('Active')
    expect(res.body.data.currentOccupancyKg).toBe(0)
    expect(res.body.data.isAvailable).toBe(true)
    expect(res.body.data.alerts).toEqual([])
  })

  it('writes a "Cold Room Created" audit log entry', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).post('/api/v1/cold-rooms').set('Authorization', `Bearer ${token}`).send(validPayload(warehouse._id.toString()))

    const entries = await AuditLog.find({ entityType: 'ColdRoom', entityId: res.body.data.id, action: 'Cold Room Created' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for an unknown warehouseId', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/cold-rooms')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload('665f1a2b3c4d5e6f7a8b9c0d'))
    expect(res.status).toBe(404)
  })

  it('rejects a temperature range where max is below min', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/cold-rooms')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(warehouse._id.toString(), { targetTemperatureMinC: 10, targetTemperatureMaxC: 0 }))
    expect(res.status).toBe(422)
  })

  it('rejects a humidity range where max is below min', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/cold-rooms')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(warehouse._id.toString(), { targetHumidityMinPercent: 90, targetHumidityMaxPercent: 50 }))
    expect(res.status).toBe(422)
  })

  it('rejects a non-positive capacityKg', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/cold-rooms')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(warehouse._id.toString(), { capacityKg: 0 }))
    expect(res.status).toBe(422)
  })

  it('rejects an incomplete payload', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/cold-rooms').set('Authorization', `Bearer ${token}`).send({ name: 'X' })
    expect(res.status).toBe(422)
  })

  it('rejects a caller without warehouses.manage', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations([])

    const res = await request(testApp).post('/api/v1/cold-rooms').set('Authorization', `Bearer ${token}`).send(validPayload(warehouse._id.toString()))
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const warehouse = await createWarehouseRecord()
    const res = await request(testApp).post('/api/v1/cold-rooms').send(validPayload(warehouse._id.toString()))
    expect(res.status).toBe(401)
  })
})
