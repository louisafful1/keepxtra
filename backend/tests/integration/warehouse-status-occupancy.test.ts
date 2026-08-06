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

describe('PATCH /api/v1/warehouses/:id/status', () => {
  it('changes the status', async () => {
    const warehouse = await createWarehouseRecord({ status: 'Active' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Under Maintenance' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Under Maintenance')
  })

  it('writes a "Warehouse Status Changed" audit log entry', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/warehouses/${warehouse._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Inactive' })

    const entries = await AuditLog.find({ entityType: 'Warehouse', entityId: warehouse._id.toString(), action: 'Warehouse Status Changed' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects an invalid status', async () => {
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/warehouses/${warehouse._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Closed' })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/warehouses/665f1a2b3c4d5e6f7a8b9c0d/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Inactive' })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/warehouses/:id/occupancy', () => {
  it('adjusts total occupancy directly for a warehouse with no zones', async () => {
    const warehouse = await createWarehouseRecord({ totalCapacityKg: 10000, zones: [] })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}/occupancy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ occupancyKg: 4000 })

    expect(res.status).toBe(200)
    expect(res.body.data.currentOccupancyKg).toBe(4000)
  })

  it('rejects occupancy exceeding total capacity for a zone-less warehouse', async () => {
    const warehouse = await createWarehouseRecord({ totalCapacityKg: 10000, zones: [] })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}/occupancy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ occupancyKg: 20000 })
    expect(res.status).toBe(409)
  })

  it('rejects a zoneId on a zone-less warehouse', async () => {
    const warehouse = await createWarehouseRecord({ zones: [] })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}/occupancy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ zoneId: '665f1a2b3c4d5e6f7a8b9c0d', occupancyKg: 100 })
    expect(res.status).toBe(400)
  })

  it('adjusts a specific zone and recomputes the warehouse total', async () => {
    const warehouse = await createWarehouseRecord({
      totalCapacityKg: 50000,
      zones: [
        { name: 'Zone A', capacityKg: 20000, currentOccupancyKg: 5000 },
        { name: 'Zone B', capacityKg: 20000, currentOccupancyKg: 1000 },
      ] as never,
      currentOccupancyKg: 6000,
    })
    const token = await loginAsOperations()
    const zoneAId = warehouse.zones[0]!._id.toString()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}/occupancy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ zoneId: zoneAId, occupancyKg: 8000 })

    expect(res.status).toBe(200)
    const zones = res.body.data.zones as { id: string; currentOccupancyKg: number }[]
    expect(zones.find((z) => z.id === zoneAId)?.currentOccupancyKg).toBe(8000)
    expect(res.body.data.currentOccupancyKg).toBe(9000)
  })

  it('rejects missing zoneId on a zoned warehouse', async () => {
    const warehouse = await createWarehouseRecord({ zones: [{ name: 'Zone A', capacityKg: 10000, currentOccupancyKg: 0 }] as never })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}/occupancy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ occupancyKg: 100 })
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown zoneId', async () => {
    const warehouse = await createWarehouseRecord({ zones: [{ name: 'Zone A', capacityKg: 10000, currentOccupancyKg: 0 }] as never })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}/occupancy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ zoneId: '665f1a2b3c4d5e6f7a8b9c0d', occupancyKg: 100 })
    expect(res.status).toBe(404)
  })

  it('rejects occupancy exceeding a zone’s own capacity', async () => {
    const warehouse = await createWarehouseRecord({ zones: [{ name: 'Zone A', capacityKg: 10000, currentOccupancyKg: 0 }] as never })
    const token = await loginAsOperations()
    const zoneId = warehouse.zones[0]!._id.toString()

    const res = await request(testApp)
      .patch(`/api/v1/warehouses/${warehouse._id.toString()}/occupancy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ zoneId, occupancyKg: 20000 })
    expect(res.status).toBe(409)
  })

  it('writes a "Warehouse Occupancy Adjusted" audit log entry', async () => {
    const warehouse = await createWarehouseRecord({ zones: [] })
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/warehouses/${warehouse._id.toString()}/occupancy`).set('Authorization', `Bearer ${token}`).send({ occupancyKg: 100 })

    const entries = await AuditLog.find({ entityType: 'Warehouse', entityId: warehouse._id.toString(), action: 'Warehouse Occupancy Adjusted' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for an unknown warehouse id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/warehouses/665f1a2b3c4d5e6f7a8b9c0d/occupancy')
      .set('Authorization', `Bearer ${token}`)
      .send({ occupancyKg: 100 })
    expect(res.status).toBe(404)
  })
})
