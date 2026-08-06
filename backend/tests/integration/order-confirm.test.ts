import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createInventoryRecord, createOrderRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { Inventory } from '../../src/models/inventory.model'
import { InventoryMovement } from '../../src/models/inventoryMovement.model'
import { AuditLog } from '../../src/models/auditLog.model'
import { ORDER_EVENTS, orderEvents, type OrderConfirmedEvent } from '../../src/events/order.events'

async function loginAsOperations(permissionKeys: string[] = ['sales.create']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('POST /api/v1/orders/:id/confirm', () => {
  it('deducts inventory, issues an invoice, and moves the order to Confirmed', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Confirmed')
    expect(res.body.data.invoiceNumber).toMatch(/^INV-\d{5}$/)
    expect(res.body.data.confirmedAt).not.toBeNull()

    const updatedInventory = await Inventory.findById(inventory._id).exec()
    expect(updatedInventory?.currentQuantity).toBe(400) // 500 - 100 (default order factory quantity)
  })

  it('logs an inventory "Adjustment" movement referencing the order number', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)

    const movements = await InventoryMovement.find({ inventoryId: inventory._id, type: 'Adjustment' }).exec()
    expect(movements).toHaveLength(1)
    expect(movements[0]?.quantityChange).toBe(-100)
    expect(movements[0]?.reason).toContain(order.orderNumber)
  })

  it('depletes the inventory record when the confirmed quantity exhausts it', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 100, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)

    const updatedInventory = await Inventory.findById(inventory._id).exec()
    expect(updatedInventory?.currentQuantity).toBe(0)
    expect(updatedInventory?.status).toBe('Depleted')
  })

  it('writes an "Order Confirmed" audit log entry', async () => {
    const { order } = await createOrderRecord()
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Order', entityId: order._id.toString(), action: 'Order Confirmed' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('emits order.confirmed with per-farmer earnings', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    const token = await loginAsOperations()

    const received: OrderConfirmedEvent[] = []
    const listener = (event: OrderConfirmedEvent) => received.push(event)
    orderEvents.on(ORDER_EVENTS.CONFIRMED, listener)

    try {
      await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ orderId: order._id.toString() })
      expect(received[0]?.farmerEarnings).toEqual([{ farmerId: inventory.farmerId.toString(), amount: 300 }])
    } finally {
      orderEvents.off(ORDER_EVENTS.CONFIRMED, listener)
    }
  })

  it('rejects confirming when the linked inventory is no longer In Stock', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    // Simulate the stock being disposed after the draft was created.
    await Inventory.updateOne({ _id: inventory._id }, { $set: { status: 'Disposed' } }).exec()
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('rejects confirming when stock became insufficient after the draft was created', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    // Simulate another order consuming the stock in the meantime.
    await Inventory.updateOne({ _id: inventory._id }, { $set: { currentQuantity: 10 } }).exec()
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('rejects re-confirming an already-Confirmed order', async () => {
    const { order } = await createOrderRecord({ status: 'Confirmed' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/orders/665f1a2b3c4d5e6f7a8b9c0d/confirm').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects a caller without sales.create', async () => {
    const { order } = await createOrderRecord()
    const token = await loginAsOperations([])

    const res = await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})
