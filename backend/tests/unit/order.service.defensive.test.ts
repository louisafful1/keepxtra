import { describe, expect, it, vi, afterEach } from 'vitest'
import { orderService } from '../../src/services/order.service'
import { orderRepository } from '../../src/repositories/order.repository'
import { inventoryRepository } from '../../src/repositories/inventory.repository'
import { createFarmerRecord, createInventoryRecord, createOrderRecord } from '../utils/factories'
import { Inventory } from '../../src/models/inventory.model'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'

/** Same category as vehicle.service.defensive.test.ts and inventory.service.defensive.test.ts. */

function actorFrom(user: IUser): AuthenticatedUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarInitials: user.avatarInitials,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    roleId: user.roleId.toString(),
    roleName: 'Operations',
    permissions: ['sales.create'],
  }
}

async function opsActor(): Promise<AuthenticatedUser> {
  const { user } = await createFarmerRecord()
  return actorFrom(user)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OrderService defensive branches', () => {
  it('update throws not-found if the record disappears between findById and updateById', async () => {
    const { order } = await createOrderRecord({ status: 'Draft' })
    vi.spyOn(orderRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(orderService.update(order._id.toString(), { notes: 'x' }, await opsActor(), {})).rejects.toThrow('Order not found')
  })

  it('confirm throws not-found if the record disappears between findById and the final updateById', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    vi.spyOn(orderRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(orderService.confirm(order._id.toString(), await opsActor(), {})).rejects.toThrow('Order not found')
  })

  it('deliver throws not-found if the record disappears between findById and updateById', async () => {
    const { order } = await createOrderRecord({ status: 'Confirmed' })
    vi.spyOn(orderRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(orderService.deliver(order._id.toString(), await opsActor(), {})).rejects.toThrow('Order not found')
  })

  it('cancel throws not-found if the record disappears between findById and updateById', async () => {
    const { order } = await createOrderRecord({ status: 'Draft' })
    vi.spyOn(orderRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(orderService.cancel(order._id.toString(), { reason: 'x' }, await opsActor(), {})).rejects.toThrow('Order not found')
  })

  it('cancel skips reversing a line item whose inventory record has since been disposed', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    const actor = await opsActor()

    await orderService.confirm(order._id.toString(), actor, {})
    await Inventory.updateOne({ _id: inventory._id }, { $set: { status: 'Disposed', currentQuantity: 0 } }).exec()

    const updated = await orderService.cancel(order._id.toString(), { reason: 'x' }, actor, {})
    expect(updated.status).toBe('Cancelled')

    const stillDisposed = await Inventory.findById(inventory._id).exec()
    expect(stillDisposed?.status).toBe('Disposed')
    expect(stillDisposed?.currentQuantity).toBe(0)
  })

  it('cancel skips reversing a line item whose inventory record no longer exists', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    const actor = await opsActor()

    await orderService.confirm(order._id.toString(), actor, {})
    vi.spyOn(inventoryRepository, 'findById').mockResolvedValueOnce(null)

    const updated = await orderService.cancel(order._id.toString(), { reason: 'x' }, actor, {})
    expect(updated.status).toBe('Cancelled')
  })
})
