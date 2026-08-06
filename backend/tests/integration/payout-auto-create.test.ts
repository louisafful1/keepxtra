import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createInventoryRecord, createOrderRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { Payout } from '../../src/models/payout.model'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['sales.create']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

async function waitForPayout(orderId: string) {
  return vi.waitFor(async () => {
    const found = await Payout.findOne({ orderId }).exec()
    if (!found) throw new Error('payout not yet created')
    return found
  })
}

describe('Payout auto-creation on Order confirmation', () => {
  it('creates a Pending payout for the farmer denormalized from the order', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)

    const payout = await waitForPayout(order._id.toString())

    expect(payout.status).toBe('Pending')
    expect(payout.payoutCode).toMatch(/^PO-\d{5}$/)
    expect(payout.orderNumber).toBe(order.orderNumber)
    expect(payout.farmerId.toString()).toBe(inventory.farmerId.toString())
    expect(payout.amount).toBe(order.farmerEarningsTotal)

    const entries = await vi.waitFor(async () => {
      const found = await AuditLog.find({ entityType: 'Payout', entityId: payout._id.toString(), action: 'Payout Auto-Created' }).exec()
      if (found.length === 0) throw new Error('audit log entry not yet written')
      return found
    })
    expect(entries).toHaveLength(1)
  })

  it('does not create a payout when an order is only saved as a Draft', async () => {
    const { order } = await createOrderRecord({ status: 'Draft' })

    await new Promise((resolve) => setImmediate(resolve))
    const payout = await Payout.findOne({ orderId: order._id }).exec()
    expect(payout).toBeNull()
  })
})
