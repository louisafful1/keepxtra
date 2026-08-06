import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import {
  createActiveUser,
  createFarmerRecord,
  createInventoryRecord,
  createOrderRecord,
  createPayoutRecord,
  DEFAULT_TEST_PASSWORD,
} from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['payments.approve']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/payouts/farmer/:farmerId/summary', () => {
  it('sums outstanding (Pending + Approved) separately from Paid', async () => {
    // Three orders drawn from the same Inventory record share its farmerId,
    // so all three payouts land on one farmer without needing the
    // create*Record factory chain to thread a farmerId override through
    // Pickup/StorageRequest (which it doesn't support).
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 1000, valuePerUnit: 3 })
    const { order: order1 } = await createOrderRecord({ inventoryId: inventory._id, farmerEarningsTotal: 100 })
    const { order: order2 } = await createOrderRecord({ inventoryId: inventory._id, farmerEarningsTotal: 200 })
    const { order: order3 } = await createOrderRecord({ inventoryId: inventory._id, farmerEarningsTotal: 50 })

    await createPayoutRecord({ orderId: order1._id, amount: 100, status: 'Pending' })
    await createPayoutRecord({ orderId: order2._id, amount: 200, status: 'Approved' })
    await createPayoutRecord({ orderId: order3._id, amount: 50, status: 'Paid' })

    const token = await loginAsOperations()
    const res = await request(testApp).get(`/api/v1/payouts/farmer/${inventory.farmerId.toString()}/summary`).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.outstandingBalance).toBe(300)
    expect(res.body.data.totalPaid).toBe(50)
    expect(res.body.data.payoutCount).toBe(3)
  })

  it('returns zeroed balances for a farmer with no payouts', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/payouts/farmer/${farmer._id.toString()}/summary`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.outstandingBalance).toBe(0)
    expect(res.body.data.totalPaid).toBe(0)
    expect(res.body.data.payoutCount).toBe(0)
  })

  it('returns 404 for an unknown farmerId', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/payouts/farmer/665f1a2b3c4d5e6f7a8b9c0d/summary').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects a caller without payments.approve', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations([])

    const res = await request(testApp).get(`/api/v1/payouts/farmer/${farmer._id.toString()}/summary`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})

describe('GET /api/v1/payouts/stats/summary', () => {
  it('aggregates status counts and outstanding/paid totals', async () => {
    await createPayoutRecord({ status: 'Pending', amount: 100 })
    await createPayoutRecord({ status: 'Approved', amount: 200 })
    await createPayoutRecord({ status: 'Paid', amount: 50 })
    await createPayoutRecord({ status: 'Rejected', amount: 75 })

    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/payouts/stats/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.payoutCount).toBe(4)
    expect(res.body.data.byStatus.Pending).toBe(1)
    expect(res.body.data.byStatus.Approved).toBe(1)
    expect(res.body.data.byStatus.Paid).toBe(1)
    expect(res.body.data.byStatus.Rejected).toBe(1)
    expect(res.body.data.totalOutstanding).toBe(300)
    expect(res.body.data.totalPaid).toBe(50)
  })

  it('returns zeroed stats when there are no payouts', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/payouts/stats/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.payoutCount).toBe(0)
  })

  it('rejects a caller without payments.approve', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/payouts/stats/summary').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})
