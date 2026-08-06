import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createInventoryRecord, createOrderRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { Inventory } from '../../src/models/inventory.model'
import { InventoryMovement } from '../../src/models/inventoryMovement.model'
import { AuditLog } from '../../src/models/auditLog.model'
import { ORDER_EVENTS, orderEvents, type OrderCancelledEvent } from '../../src/events/order.events'

async function loginAsOperations(permissionKeys: string[] = ['sales.create']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('POST /api/v1/orders/:id/deliver', () => {
  it('marks a Confirmed order Delivered', async () => {
    const { order } = await createOrderRecord({ status: 'Confirmed' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/orders/${order._id.toString()}/deliver`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Delivered')
    expect(res.body.data.deliveredAt).not.toBeNull()
  })

  it('writes an "Order Delivered" audit log entry', async () => {
    const { order } = await createOrderRecord({ status: 'Confirmed' })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/orders/${order._id.toString()}/deliver`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Order', entityId: order._id.toString(), action: 'Order Delivered' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects delivering a Draft order', async () => {
    const { order } = await createOrderRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/orders/${order._id.toString()}/deliver`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/orders/665f1a2b3c4d5e6f7a8b9c0d/deliver').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/orders/:id/cancel', () => {
  it('cancels a Draft order without touching inventory', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id, status: 'Draft' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/orders/${order._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Customer changed mind' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Cancelled')

    const updatedInventory = await Inventory.findById(inventory._id).exec()
    expect(updatedInventory?.currentQuantity).toBe(500)
  })

  it('reverses the inventory deduction when cancelling a Confirmed order', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)
    const afterConfirm = await Inventory.findById(inventory._id).exec()
    expect(afterConfirm?.currentQuantity).toBe(400)

    const res = await request(testApp)
      .post(`/api/v1/orders/${order._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Customer changed mind' })
    expect(res.status).toBe(200)

    const afterCancel = await Inventory.findById(inventory._id).exec()
    expect(afterCancel?.currentQuantity).toBe(500)
    expect(afterCancel?.status).toBe('In Stock')
  })

  it('logs a reversing "Adjustment" movement when cancelling a Confirmed order', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/orders/${order._id.toString()}/confirm`).set('Authorization', `Bearer ${token}`)
    await request(testApp).post(`/api/v1/orders/${order._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })

    const movements = await InventoryMovement.find({ inventoryId: inventory._id, type: 'Adjustment' }).sort({ createdAt: 1 }).exec()
    expect(movements).toHaveLength(2)
    expect(movements[0]?.quantityChange).toBe(-100)
    expect(movements[1]?.quantityChange).toBe(100)
    expect(movements[1]?.reason).toContain(order.orderNumber)
  })

  it('writes an "Order Cancelled" audit log entry', async () => {
    const { order } = await createOrderRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/orders/${order._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })

    const entries = await AuditLog.find({ entityType: 'Order', entityId: order._id.toString(), action: 'Order Cancelled' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('emits order.cancelled with wasConfirmed reflecting the prior status', async () => {
    const { order } = await createOrderRecord({ status: 'Confirmed' })
    const token = await loginAsOperations()

    const received: OrderCancelledEvent[] = []
    const listener = (event: OrderCancelledEvent) => received.push(event)
    orderEvents.on(ORDER_EVENTS.CANCELLED, listener)

    try {
      await request(testApp).post(`/api/v1/orders/${order._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ orderId: order._id.toString(), wasConfirmed: true })
    } finally {
      orderEvents.off(ORDER_EVENTS.CANCELLED, listener)
    }
  })

  it('requires a cancellation reason', async () => {
    const { order } = await createOrderRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/orders/${order._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(422)
  })

  it('rejects cancelling a Delivered order', async () => {
    const { order } = await createOrderRecord({ status: 'Delivered' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/orders/${order._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
    expect(res.status).toBe(409)
  })

  it('rejects cancelling an already-Cancelled order', async () => {
    const { order } = await createOrderRecord({ status: 'Cancelled' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/orders/${order._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/orders/665f1a2b3c4d5e6f7a8b9c0d/cancel').set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
    expect(res.status).toBe(404)
  })

  it('rejects a caller without sales.create', async () => {
    const { order } = await createOrderRecord({ status: 'Draft' })
    const token = await loginAsOperations([])

    const res = await request(testApp).post(`/api/v1/orders/${order._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
    expect(res.status).toBe(403)
  })
})
