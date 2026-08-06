import { describe, expect, it } from 'vitest'
import { Order } from '../../src/models/order.model'
import { createOrderRecord } from '../utils/factories'

describe('Order model constraints', () => {
  it('rejects a duplicate orderNumber', async () => {
    await createOrderRecord({ orderNumber: 'ORD-90001' })
    await expect(createOrderRecord({ orderNumber: 'ORD-90001' })).rejects.toThrow()
  })

  it('rejects an order with no items', async () => {
    const { customer } = await createOrderRecord()
    await expect(
      Order.create({
        orderNumber: 'ORD-90002',
        customerId: customer._id,
        customerName: customer.name,
        items: [],
        subtotalAmount: 0,
        totalAmount: 0,
        farmerEarningsTotal: 0,
        profitAmount: 0,
      }),
    ).rejects.toThrow()
  })

  it('rejects an invalid status', async () => {
    const { order } = await createOrderRecord()
    await expect(
      Order.create({
        orderNumber: 'ORD-90003',
        customerId: order.customerId,
        customerName: order.customerName,
        items: order.items,
        subtotalAmount: order.subtotalAmount,
        totalAmount: order.totalAmount,
        farmerEarningsTotal: order.farmerEarningsTotal,
        profitAmount: order.profitAmount,
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        status: 'Shipped',
      }),
    ).rejects.toThrow()
  })

  it('defaults status to Draft', async () => {
    const { order } = await createOrderRecord({ status: undefined })
    expect(order.status).toBe('Draft')
  })
})
