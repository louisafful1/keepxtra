import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createInventoryRecord, createPayoutRecord, createWarehouseRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsReportsViewer() {
  await createActiveUser({ email: 'reports-viewer2@keepxtra.com', permissionKeys: ['reports.view'] })
  return loginAndGetToken('reports-viewer2@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/reports/farmers', () => {
  it('ranks farmers by total paid payouts', async () => {
    const { payout: bigPayout } = await createPayoutRecord({ status: 'Paid', amount: 900 })
    await createPayoutRecord({ status: 'Pending', amount: 5000 }) // not Paid — must not outrank the Paid one

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/farmers').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.topFarmers[0].farmerId).toBe(bigPayout.farmerId.toString())
    expect(res.body.data.topFarmers[0].totalPaid).toBe(900)
    expect(res.body.data.totalFarmers).toBeGreaterThanOrEqual(2)
  })

  it('respects the limit query param', async () => {
    for (let i = 0; i < 3; i += 1) {
      await createPayoutRecord({ status: 'Paid', amount: 100 + i })
    }

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/farmers').query({ limit: 2 }).set('Authorization', `Bearer ${token}`)
    expect(res.body.data.topFarmers).toHaveLength(2)
  })
})

describe('GET /api/v1/reports/warehouses', () => {
  it('computes per-warehouse and average utilization', async () => {
    await createWarehouseRecord({ totalCapacityKg: 1000, currentOccupancyKg: 500 })
    await createWarehouseRecord({ totalCapacityKg: 2000, currentOccupancyKg: 0 })

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/warehouses').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const warehouses = res.body.data.warehouses as { utilizationPercent: number }[]
    const half = warehouses.find((w) => w.utilizationPercent === 50)
    expect(half).toBeDefined()
    expect(res.body.data.averageUtilizationPercent).toBe(25)
  })
})

describe('GET /api/v1/reports/inventory', () => {
  it('breaks inventory down by produce type, warehouse, and status', async () => {
    const warehouse = await createWarehouseRecord()
    await createInventoryRecord({
      status: 'In Stock',
      produceType: 'Tomato',
      currentQuantity: 200,
      valuePerUnit: 2,
      warehouseId: warehouse._id,
      warehouseCode: warehouse.warehouseCode,
      warehouseName: warehouse.name,
    })
    await createInventoryRecord({ status: 'Depleted' })

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/inventory').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const byProduceType = res.body.data.byProduceType as { produceType: string; quantity: number; totalValue: number }[]
    const tomatoRow = byProduceType.find((p) => p.produceType === 'Tomato')
    expect(tomatoRow?.quantity).toBe(200)
    expect(tomatoRow?.totalValue).toBe(400)
    const byWarehouse = res.body.data.byWarehouse as { warehouseCode: string; quantity: number }[]
    const warehouseRow = byWarehouse.find((w) => w.warehouseCode === warehouse.warehouseCode)
    expect(warehouseRow?.quantity).toBe(200)
    expect(res.body.data.byStatus['In Stock']).toBeGreaterThanOrEqual(1)
    expect(res.body.data.byStatus.Depleted).toBeGreaterThanOrEqual(1)
  })
})
