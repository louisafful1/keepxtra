import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createCustomerRecord, createInventoryRecord, createOrderRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['sales.create']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('POST /api/v1/orders', () => {
  it('creates a draft order and computes financial totals', async () => {
    const customer = await createCustomerRecord()
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: customer._id.toString(), items: [{ inventoryId: inventory._id.toString(), quantity: 100, unitPrice: 5.5 }] })

    expect(res.status).toBe(201)
    expect(res.body.data.orderNumber).toMatch(/^ORD-\d{5}$/)
    expect(res.body.data.status).toBe('Draft')
    expect(res.body.data.subtotalAmount).toBe(550)
    expect(res.body.data.totalAmount).toBe(550)
    expect(res.body.data.farmerEarningsTotal).toBe(300)
    expect(res.body.data.profitAmount).toBe(250)
    expect(res.body.data.invoiceNumber).toBeNull()
  })

  it('sums multiple items across the order total', async () => {
    const customer = await createCustomerRecord()
    const { inventory: inv1 } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { inventory: inv2 } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 200, valuePerUnit: 2 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer._id.toString(),
        items: [
          { inventoryId: inv1._id.toString(), quantity: 100, unitPrice: 5 },
          { inventoryId: inv2._id.toString(), quantity: 50, unitPrice: 4 },
        ],
      })

    expect(res.status).toBe(201)
    expect(res.body.data.subtotalAmount).toBe(700)
    expect(res.body.data.farmerEarningsTotal).toBe(400)
    expect(res.body.data.profitAmount).toBe(300)
  })

  it('writes an "Order Created" audit log entry', async () => {
    const customer = await createCustomerRecord()
    const { inventory } = await createInventoryRecord({ status: 'In Stock', valuePerUnit: 3 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: customer._id.toString(), items: [{ inventoryId: inventory._id.toString(), quantity: 10, unitPrice: 5 }] })

    const entries = await AuditLog.find({ entityType: 'Order', entityId: res.body.data.id, action: 'Order Created' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for an unknown customerId', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', valuePerUnit: 3 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: '665f1a2b3c4d5e6f7a8b9c0d', items: [{ inventoryId: inventory._id.toString(), quantity: 10, unitPrice: 5 }] })
    expect(res.status).toBe(404)
  })

  it('returns 404 for an unknown inventoryId', async () => {
    const customer = await createCustomerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: customer._id.toString(), items: [{ inventoryId: '665f1a2b3c4d5e6f7a8b9c0d', quantity: 10, unitPrice: 5 }] })
    expect(res.status).toBe(404)
  })

  it('rejects an item referencing an inventory record that is not In Stock', async () => {
    const customer = await createCustomerRecord()
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: customer._id.toString(), items: [{ inventoryId: inventory._id.toString(), quantity: 10, unitPrice: 5 }] })
    expect(res.status).toBe(409)
  })

  it('rejects an item referencing inventory with no recorded value', async () => {
    const customer = await createCustomerRecord()
    const { inventory } = await createInventoryRecord({ status: 'In Stock', valuePerUnit: null })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: customer._id.toString(), items: [{ inventoryId: inventory._id.toString(), quantity: 10, unitPrice: 5 }] })
    expect(res.status).toBe(409)
  })

  it('rejects an item quantity exceeding available stock', async () => {
    const customer = await createCustomerRecord()
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 50, valuePerUnit: 3 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: customer._id.toString(), items: [{ inventoryId: inventory._id.toString(), quantity: 100, unitPrice: 5 }] })
    expect(res.status).toBe(409)
  })

  it('rejects an empty items array', async () => {
    const customer = await createCustomerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).post('/api/v1/orders').set('Authorization', `Bearer ${token}`).send({ customerId: customer._id.toString(), items: [] })
    expect(res.status).toBe(422)
  })

  it('rejects a caller without sales.create', async () => {
    const customer = await createCustomerRecord()
    const { inventory } = await createInventoryRecord({ status: 'In Stock', valuePerUnit: 3 })
    const token = await loginAsOperations([])

    const res = await request(testApp)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: customer._id.toString(), items: [{ inventoryId: inventory._id.toString(), quantity: 10, unitPrice: 5 }] })
    expect(res.status).toBe(403)
  })
})

describe('GET /api/v1/orders', () => {
  it('lists every order', async () => {
    await createOrderRecord()
    await createOrderRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/orders').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('searches by order number', async () => {
    const { order } = await createOrderRecord({ orderNumber: 'ORD-77001' })
    await createOrderRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/orders').query({ search: 'ORD-77001' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).toBe(order._id.toString())
  })

  it('filters by status', async () => {
    await createOrderRecord({ status: 'Draft' })
    await createOrderRecord({ status: 'Delivered' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/orders').query({ status: 'Delivered' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('filters by customerId', async () => {
    const { order, customer } = await createOrderRecord()
    await createOrderRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/orders').query({ customerId: customer._id.toString() }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).toBe(order._id.toString())
  })

  it('rejects a caller without sales.create', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/orders').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})

describe('GET /api/v1/orders/:id', () => {
  it('returns the order', async () => {
    const { order } = await createOrderRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/orders/${order._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(order._id.toString())
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/orders/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
