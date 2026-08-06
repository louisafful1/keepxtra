import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createWarehouseRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['warehouses.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/warehouses/:id/stats', () => {
  it('returns utilization stats with a per-zone breakdown', async () => {
    const warehouse = await createWarehouseRecord({
      totalCapacityKg: 10000,
      currentOccupancyKg: 4000,
      zones: [
        { name: 'Zone A', capacityKg: 5000, currentOccupancyKg: 2500 },
        { name: 'Zone B', capacityKg: 5000, currentOccupancyKg: 1500 },
      ] as never,
    })
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/warehouses/${warehouse._id.toString()}/stats`).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalCapacityKg).toBe(10000)
    expect(res.body.data.currentOccupancyKg).toBe(4000)
    expect(res.body.data.availableCapacityKg).toBe(6000)
    expect(res.body.data.utilizationPercent).toBe(40)
    expect(res.body.data.zones).toHaveLength(2)
    expect(res.body.data.zones[0].utilizationPercent).toBe(50)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/warehouses/665f1a2b3c4d5e6f7a8b9c0d/stats').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/warehouses/stats/summary', () => {
  it('aggregates capacity/occupancy across every warehouse', async () => {
    await createWarehouseRecord({ totalCapacityKg: 10000, currentOccupancyKg: 2000, status: 'Active' })
    await createWarehouseRecord({ totalCapacityKg: 20000, currentOccupancyKg: 8000, status: 'Under Maintenance' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/warehouses/stats/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.warehouseCount).toBe(2)
    expect(res.body.data.totalCapacityKg).toBe(30000)
    expect(res.body.data.totalOccupancyKg).toBe(10000)
    expect(res.body.data.availableCapacityKg).toBe(20000)
    expect(res.body.data.utilizationPercent).toBeCloseTo(33.33, 1)
    expect(res.body.data.byStatus.Active).toBe(1)
    expect(res.body.data.byStatus['Under Maintenance']).toBe(1)
    expect(res.body.data.byStatus.Inactive).toBe(0)
  })

  it('returns zeroed stats when there are no warehouses', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/warehouses/stats/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.warehouseCount).toBe(0)
    expect(res.body.data.utilizationPercent).toBe(0)
  })

  it('rejects a caller without warehouses.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/warehouses/stats/summary').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})
