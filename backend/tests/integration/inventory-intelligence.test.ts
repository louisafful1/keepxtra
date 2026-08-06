import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createColdRoomRecord, createInventoryRecord, createWarehouseRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['inventory.view']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/inventory/intelligence/summary', () => {
  it('aggregates totals, low-stock, near-expiry, and expired counts across In Stock records', async () => {
    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    await createInventoryRecord({ status: 'In Stock', initialQuantity: 1000, currentQuantity: 900, valuePerUnit: 2 })
    await createInventoryRecord({ status: 'In Stock', initialQuantity: 1000, currentQuantity: 100, valuePerUnit: 2 }) // low stock
    await createInventoryRecord({ status: 'In Stock', initialQuantity: 200, currentQuantity: 200, expiryDate: soon, valuePerUnit: 1 }) // near expiry
    await createInventoryRecord({ status: 'In Stock', initialQuantity: 50, currentQuantity: 50, expiryDate: yesterday, valuePerUnit: 1 }) // expired
    await createInventoryRecord({ status: 'In Stock', initialQuantity: 300, currentQuantity: 300 }) // no valuePerUnit — excluded from totalValue
    await createInventoryRecord({ status: 'Pending Placement' }) // excluded — not In Stock

    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/inventory/intelligence/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalItems).toBe(5)
    expect(res.body.data.lowStockCount).toBe(1)
    expect(res.body.data.nearExpiryCount).toBe(1)
    expect(res.body.data.expiredCount).toBe(1)
    expect(res.body.data.totalQuantity).toBe(900 + 100 + 200 + 50 + 300)
    expect(res.body.data.totalValue).toBe(900 * 2 + 100 * 2 + 200 * 1 + 50 * 1)
  })

  it('counts overstocked warehouses above the utilization threshold', async () => {
    await createWarehouseRecord({ totalCapacityKg: 1000, currentOccupancyKg: 950 })
    await createWarehouseRecord({ totalCapacityKg: 1000, currentOccupancyKg: 200 })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/inventory/intelligence/summary').set('Authorization', `Bearer ${token}`)
    expect(res.body.data.overstockedWarehouses).toBe(1)
  })

  it('counts overstocked cold rooms above the utilization threshold', async () => {
    await createColdRoomRecord({ capacityKg: 1000, currentOccupancyKg: 950 })
    await createColdRoomRecord({ capacityKg: 1000, currentOccupancyKg: 200 })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/inventory/intelligence/summary').set('Authorization', `Bearer ${token}`)
    expect(res.body.data.overstockedColdRooms).toBe(1)
  })

  it('returns zeroed stats when there is no inventory', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/inventory/intelligence/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalItems).toBe(0)
    expect(res.body.data.totalValue).toBe(0)
  })

  it('rejects a caller without inventory.view', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/inventory/intelligence/summary').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})
