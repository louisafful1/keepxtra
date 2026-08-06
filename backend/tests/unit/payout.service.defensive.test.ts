import { describe, expect, it, vi, afterEach } from 'vitest'
import { payoutService } from '../../src/services/payout.service'
import { payoutRepository } from '../../src/repositories/payout.repository'
import { farmerRepository } from '../../src/repositories/farmer.repository'
import { createFarmerRecord, createInventoryRecord, createOrderRecord, createPayoutRecord } from '../utils/factories'
import { Payout } from '../../src/models/payout.model'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'
import type { OrderConfirmedEvent } from '../../src/events/order.events'

/** Same category as order.service.defensive.test.ts and inventory.service.defensive.test.ts. */

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
    roleName: 'Finance',
    permissions: ['payments.approve', 'payments.process'],
  }
}

async function opsActor(): Promise<AuthenticatedUser> {
  const { user } = await createFarmerRecord()
  return actorFrom(user)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PayoutService.createFromConfirmedOrder', () => {
  it('is idempotent — a duplicate event returns the already-created payout instead of erroring', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    const { user } = await createFarmerRecord()
    const event: OrderConfirmedEvent = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      invoiceNumber: 'INV-00001',
      customerId: order.customerId.toString(),
      totalAmount: order.totalAmount,
      farmerEarnings: [{ farmerId: inventory.farmerId.toString(), amount: 300 }],
      confirmedBy: user._id.toString(),
      confirmedAt: new Date(),
    }

    const [first] = await payoutService.createFromConfirmedOrder(event)
    const [second] = await payoutService.createFromConfirmedOrder(event)

    expect(second?.id).toBe(first?.id)
    const count = await Payout.countDocuments({ orderId: order._id }).exec()
    expect(count).toBe(1)
  })

  it('throws not-found if the order no longer exists', async () => {
    const { user } = await createFarmerRecord()
    const event: OrderConfirmedEvent = {
      orderId: '665f1a2b3c4d5e6f7a8b9c0d',
      orderNumber: 'ORD-99999',
      invoiceNumber: 'INV-99999',
      customerId: '665f1a2b3c4d5e6f7a8b9c0e',
      totalAmount: 100,
      farmerEarnings: [],
      confirmedBy: user._id.toString(),
      confirmedAt: new Date(),
    }

    await expect(payoutService.createFromConfirmedOrder(event)).rejects.toThrow('Order not found')
  })

  it('skips a farmer earning entry if the farmer record is unexpectedly missing', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 })
    const { order } = await createOrderRecord({ inventoryId: inventory._id })
    const { user } = await createFarmerRecord()
    vi.spyOn(farmerRepository, 'findById').mockResolvedValueOnce(null)

    const event: OrderConfirmedEvent = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      invoiceNumber: 'INV-00002',
      customerId: order.customerId.toString(),
      totalAmount: order.totalAmount,
      farmerEarnings: [{ farmerId: inventory.farmerId.toString(), amount: 300 }],
      confirmedBy: user._id.toString(),
      confirmedAt: new Date(),
    }

    const created = await payoutService.createFromConfirmedOrder(event)
    expect(created).toHaveLength(0)
  })
})

describe('PayoutService defensive branches', () => {
  it('approve throws not-found if the record disappears between findById and updateById', async () => {
    const { payout } = await createPayoutRecord({ status: 'Pending' })
    vi.spyOn(payoutRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(payoutService.approve(payout._id.toString(), await opsActor(), {})).rejects.toThrow('Payout not found')
  })

  it('process throws not-found if the record disappears between findById and updateById', async () => {
    const { payout } = await createPayoutRecord({ status: 'Approved' })
    vi.spyOn(payoutRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      payoutService.process(payout._id.toString(), { method: 'Mobile Money', transactionId: 'TXN-1' }, await opsActor(), {}),
    ).rejects.toThrow('Payout not found')
  })

  it('process falls back to an empty farmerUserId if the farmer record is missing when the event is built', async () => {
    const { payout } = await createPayoutRecord({ status: 'Approved' })
    vi.spyOn(farmerRepository, 'findById').mockResolvedValueOnce(null)

    const updated = await payoutService.process(payout._id.toString(), { method: 'Mobile Money', transactionId: 'TXN-2' }, await opsActor(), {})
    expect(updated.status).toBe('Paid')
  })

  it('reject throws not-found if the record disappears between findById and updateById', async () => {
    const { payout } = await createPayoutRecord({ status: 'Pending' })
    vi.spyOn(payoutRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(payoutService.reject(payout._id.toString(), { reason: 'x' }, await opsActor(), {})).rejects.toThrow('Payout not found')
  })
})
