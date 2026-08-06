import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createOrderRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['sales.create']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/orders/stats/summary', () => {
  it('aggregates status counts and only counts Confirmed/Delivered revenue', async () => {
    await createOrderRecord({ status: 'Draft', subtotalAmount: 100, totalAmount: 100, farmerEarningsTotal: 60, profitAmount: 40 })
    await createOrderRecord({ status: 'Confirmed', subtotalAmount: 500, totalAmount: 500, farmerEarningsTotal: 300, profitAmount: 200 })
    await createOrderRecord({ status: 'Delivered', subtotalAmount: 300, totalAmount: 300, farmerEarningsTotal: 180, profitAmount: 120 })
    await createOrderRecord({ status: 'Cancelled', subtotalAmount: 200, totalAmount: 200, farmerEarningsTotal: 120, profitAmount: 80 })

    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/orders/stats/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.orderCount).toBe(4)
    expect(res.body.data.byStatus.Draft).toBe(1)
    expect(res.body.data.byStatus.Confirmed).toBe(1)
    expect(res.body.data.byStatus.Delivered).toBe(1)
    expect(res.body.data.byStatus.Cancelled).toBe(1)
    expect(res.body.data.totalRevenue).toBe(800)
    expect(res.body.data.totalFarmerEarnings).toBe(480)
    expect(res.body.data.totalProfit).toBe(320)
  })

  it('returns zeroed stats when there are no orders', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/orders/stats/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.orderCount).toBe(0)
    expect(res.body.data.totalRevenue).toBe(0)
  })

  it('rejects a caller without sales.create', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/orders/stats/summary').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})
