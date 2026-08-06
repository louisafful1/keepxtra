import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import {
  createActiveUser,
  createCustomerRecord,
  createFarmerRecord,
  createInventoryRecord,
  createOrderRecord,
  createPayoutRecord,
  createPickupRecord,
  createStorageRequestRecord,
  DEFAULT_TEST_PASSWORD,
} from '../utils/factories'

async function loginAsReportsViewer(permissionKeys: string[] = ['reports.view']) {
  await createActiveUser({ email: 'reports-viewer@keepxtra.com', permissionKeys })
  return loginAndGetToken('reports-viewer@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/reports/dashboard', () => {
  it('summarizes cross-module counts', async () => {
    await createFarmerRecord({ status: 'Active' })
    await createStorageRequestRecord({ status: 'Submitted' })
    await createPickupRecord({ status: 'Scheduled' })
    await createInventoryRecord({ status: 'In Stock' })
    const now = new Date()
    const restaurant = await createCustomerRecord({ type: 'Restaurant' })
    await createOrderRecord({ customerId: restaurant._id, status: 'Confirmed', confirmedAt: now, totalAmount: 500 })
    await createPayoutRecord({ status: 'Pending', amount: 40 })
    await createPayoutRecord({ status: 'Paid', amount: 999 }) // already paid — must not count toward pendingPayoutsAmount

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/dashboard').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.activeFarmers).toBeGreaterThanOrEqual(1)
    expect(res.body.data.pendingStorageRequests).toBeGreaterThanOrEqual(1)
    expect(res.body.data.activePickups).toBeGreaterThanOrEqual(1)
    expect(res.body.data.inStockInventoryCount).toBeGreaterThanOrEqual(1)
    expect(res.body.data.ordersThisMonth).toBeGreaterThanOrEqual(1)
    expect(res.body.data.revenueThisMonth).toBeGreaterThanOrEqual(500)
    expect(res.body.data.pendingPayoutsAmount).toBeGreaterThanOrEqual(40)
  })

  it('rejects a caller without reports.view', async () => {
    const token = await loginAsReportsViewer([])
    const res = await request(testApp).get('/api/v1/reports/dashboard').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/reports/dashboard')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/reports/revenue', () => {
  it('groups confirmed/delivered order revenue by month', async () => {
    const customer = await createCustomerRecord()
    const confirmedAt = new Date('2026-03-15T00:00:00.000Z')
    await createOrderRecord({ customerId: customer._id, status: 'Confirmed', confirmedAt, totalAmount: 300, farmerEarningsTotal: 200, profitAmount: 100 })
    await createOrderRecord({ customerId: customer._id, status: 'Delivered', confirmedAt, totalAmount: 150, farmerEarningsTotal: 100, profitAmount: 50 })
    // Draft orders never confirmed shouldn't count toward revenue.
    await createOrderRecord({ customerId: customer._id, status: 'Draft' })

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/revenue').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totals.orderCount).toBe(2)
    expect(res.body.data.totals.totalRevenue).toBe(450)
    const trend = res.body.data.trend as { year: number; month: number; orderCount: number; totalRevenue: number }[]
    const march = trend.find((p) => p.year === 2026 && p.month === 3)
    expect(march?.orderCount).toBe(2)
    expect(march?.totalRevenue).toBe(450)
  })

  it('filters by date range', async () => {
    const customer = await createCustomerRecord()
    await createOrderRecord({ customerId: customer._id, status: 'Confirmed', confirmedAt: new Date('2025-01-01'), totalAmount: 100 })
    await createOrderRecord({ customerId: customer._id, status: 'Confirmed', confirmedAt: new Date('2026-06-01'), totalAmount: 200 })

    const token = await loginAsReportsViewer()
    const res = await request(testApp)
      .get('/api/v1/reports/revenue')
      .query({ from: '2026-01-01', to: '2026-12-31' })
      .set('Authorization', `Bearer ${token}`)

    expect(res.body.data.totals.orderCount).toBe(1)
    expect(res.body.data.totals.totalRevenue).toBe(200)
  })

  it('filters by an open-ended "from" date alone', async () => {
    const customer = await createCustomerRecord()
    await createOrderRecord({ customerId: customer._id, status: 'Confirmed', confirmedAt: new Date('2025-01-01'), totalAmount: 100 })
    await createOrderRecord({ customerId: customer._id, status: 'Confirmed', confirmedAt: new Date('2026-06-01'), totalAmount: 200 })

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/revenue').query({ from: '2026-01-01' }).set('Authorization', `Bearer ${token}`)

    expect(res.body.data.totals.orderCount).toBe(1)
    expect(res.body.data.totals.totalRevenue).toBe(200)
  })

  it('filters by an open-ended "to" date alone', async () => {
    const customer = await createCustomerRecord()
    await createOrderRecord({ customerId: customer._id, status: 'Confirmed', confirmedAt: new Date('2025-01-01'), totalAmount: 100 })
    await createOrderRecord({ customerId: customer._id, status: 'Confirmed', confirmedAt: new Date('2026-06-01'), totalAmount: 200 })

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/revenue').query({ to: '2025-12-31' }).set('Authorization', `Bearer ${token}`)

    expect(res.body.data.totals.orderCount).toBe(1)
    expect(res.body.data.totals.totalRevenue).toBe(100)
  })
})

describe('GET /api/v1/reports/sales', () => {
  it('breaks orders down by status and by customer type', async () => {
    const restaurant = await createCustomerRecord({ type: 'Restaurant' })
    const hotel = await createCustomerRecord({ type: 'Hotel' })
    await createOrderRecord({ customerId: restaurant._id, status: 'Confirmed', confirmedAt: new Date(), totalAmount: 100 })
    await createOrderRecord({ customerId: hotel._id, status: 'Delivered', confirmedAt: new Date(), totalAmount: 200 })
    await createOrderRecord({ customerId: restaurant._id, status: 'Draft' })

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/sales').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const byStatus = res.body.data.byStatus as { status: string; orderCount: number }[]
    const draftRow = byStatus.find((s) => s.status === 'Draft')
    expect(draftRow?.orderCount).toBe(1)
    const confirmedRow = byStatus.find((s) => s.status === 'Confirmed')
    expect(confirmedRow?.orderCount).toBe(1)
    const byCustomerType = res.body.data.byCustomerType as { customerType: string; totalRevenue: number }[]
    const restaurantRow = byCustomerType.find((c) => c.customerType === 'Restaurant')
    expect(restaurantRow?.totalRevenue).toBe(100)
    expect(res.body.data.totals.totalRevenue).toBe(300)
  })
})
