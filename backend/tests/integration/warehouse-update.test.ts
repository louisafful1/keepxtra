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

describe('PATCH /api/v1/warehouses/:id', () => {
  it('updates basic fields', async () => {
    const warehouse = await createWarehouseRecord({ name: 'Old Name' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' })

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('New Name')
  })

  it('replacing zones recomputes currentOccupancyKg as the sum of the new zones', async () => {
    const warehouse = await createWarehouseRecord({ totalCapacityKg: 50000, currentOccupancyKg: 0, zones: [] })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ zones: [{ name: 'Zone A', capacityKg: 10000, currentOccupancyKg: 2500 }] })

    expect(res.status).toBe(200)
    expect(res.body.data.zones).toHaveLength(1)
    expect(res.body.data.currentOccupancyKg).toBe(2500)
  })

  it('dropping back to zero zones preserves the last recorded occupancy total', async () => {
    const warehouse = await createWarehouseRecord({
      totalCapacityKg: 50000,
      zones: [{ name: 'Zone A', capacityKg: 10000, currentOccupancyKg: 3000 } as never],
      currentOccupancyKg: 3000,
    })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/warehouses/${warehouse._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ zones: [] })

    expect(res.status).toBe(200)
    expect(res.body.data.zones).toEqual([])
    expect(res.body.data.currentOccupancyKg).toBe(3000)
  })

  it('writes a "Warehouse Updated" audit log entry', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/warehouses/${warehouse._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ name: 'Renamed' })

    const entries = await AuditLog.find({ entityType: 'Warehouse', entityId: warehouse._id.toString(), action: 'Warehouse Updated' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects a zones replacement that exceeds the (possibly reduced) total capacity', async () => {
    const warehouse = await createWarehouseRecord({ totalCapacityKg: 50000 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ totalCapacityKg: 5000, zones: [{ name: 'Zone A', capacityKg: 6000 }] })
    expect(res.status).toBe(409)
  })

  it('rejects an attempt to set warehouseCode directly', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseCode: 'WH-99999' })
    expect(res.status).toBe(422)
  })

  it('rejects an attempt to set status directly', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/warehouses/${warehouse._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ status: 'Inactive' })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).patch('/api/v1/warehouses/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`).send({ name: 'X' })
    expect(res.status).toBe(404)
  })

  it('rejects a caller without warehouses.manage', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations([])

    const res = await request(testApp).patch(`/api/v1/warehouses/${warehouse._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ name: 'X' })
    expect(res.status).toBe(403)
  })
})
