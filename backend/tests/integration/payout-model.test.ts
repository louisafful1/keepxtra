import { describe, expect, it } from 'vitest'
import { Payout } from '../../src/models/payout.model'
import { createPayoutRecord } from '../utils/factories'

describe('Payout model constraints', () => {
  it('rejects a duplicate payoutCode', async () => {
    await createPayoutRecord({ payoutCode: 'PO-90001' })
    await expect(createPayoutRecord({ payoutCode: 'PO-90001' })).rejects.toThrow()
  })

  it('rejects a second payout for the same order + farmer', async () => {
    const { order } = await createPayoutRecord()
    await expect(createPayoutRecord({ orderId: order._id })).rejects.toThrow()
  })

  it('rejects a non-positive amount', async () => {
    const { payout } = await createPayoutRecord()
    await expect(
      Payout.create({
        payoutCode: 'PO-90002',
        farmerId: payout.farmerId,
        farmerName: payout.farmerName,
        farmerNumber: payout.farmerNumber,
        orderId: payout.orderId,
        orderNumber: 'ORD-DIFFERENT',
        amount: 0,
      }),
    ).rejects.toThrow()
  })

  it('rejects an invalid status', async () => {
    const { payout } = await createPayoutRecord()
    await expect(
      Payout.create({
        payoutCode: 'PO-90003',
        farmerId: payout.farmerId,
        farmerName: payout.farmerName,
        farmerNumber: payout.farmerNumber,
        orderId: payout.orderId,
        orderNumber: 'ORD-DIFFERENT2',
        amount: 100,
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        status: 'Cancelled',
      }),
    ).rejects.toThrow()
  })

  it('defaults status to Pending', async () => {
    const { payout } = await createPayoutRecord({ status: undefined })
    expect(payout.status).toBe('Pending')
  })
})
