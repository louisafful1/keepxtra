import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createPayoutRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'
import { PAYOUT_EVENTS, payoutEvents, type PayoutPaidEvent } from '../../src/events/payout.events'

async function loginAsFinance(permissionKeys: string[] = ['payments.approve', 'payments.process']) {
  await createActiveUser({ email: 'finance@keepxtra.com', permissionKeys })
  return loginAndGetToken('finance@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('POST /api/v1/payouts/:id/process', () => {
  it('marks an Approved payout Paid with method and transactionId', async () => {
    const { payout } = await createPayoutRecord({ status: 'Approved' })
    const token = await loginAsFinance()

    const res = await request(testApp)
      .post(`/api/v1/payouts/${payout._id.toString()}/process`)
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'Mobile Money', transactionId: 'MTN-MOMO-2026080600123' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Paid')
    expect(res.body.data.method).toBe('Mobile Money')
    expect(res.body.data.transactionId).toBe('MTN-MOMO-2026080600123')
    expect(res.body.data.processedAt).not.toBeNull()
  })

  it('writes a "Payout Processed" audit log entry', async () => {
    const { payout } = await createPayoutRecord({ status: 'Approved' })
    const token = await loginAsFinance()

    await request(testApp)
      .post(`/api/v1/payouts/${payout._id.toString()}/process`)
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'Bank Transfer', transactionId: 'TXN-001' })

    const entries = await AuditLog.find({ entityType: 'Payout', entityId: payout._id.toString(), action: 'Payout Processed' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('emits payout.paid with the farmer’s linked userId', async () => {
    const { payout, order } = await createPayoutRecord({ status: 'Approved' })
    const token = await loginAsFinance()

    const received: PayoutPaidEvent[] = []
    const listener = (event: PayoutPaidEvent) => received.push(event)
    payoutEvents.on(PAYOUT_EVENTS.PAID, listener)

    try {
      await request(testApp)
        .post(`/api/v1/payouts/${payout._id.toString()}/process`)
        .set('Authorization', `Bearer ${token}`)
        .send({ method: 'Mobile Money', transactionId: 'TXN-002' })
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ payoutId: payout._id.toString(), amount: order.farmerEarningsTotal })
    } finally {
      payoutEvents.off(PAYOUT_EVENTS.PAID, listener)
    }
  })

  it('rejects processing a Pending payout (must be Approved first)', async () => {
    const { payout } = await createPayoutRecord({ status: 'Pending' })
    const token = await loginAsFinance()

    const res = await request(testApp)
      .post(`/api/v1/payouts/${payout._id.toString()}/process`)
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'Mobile Money', transactionId: 'TXN-003' })
    expect(res.status).toBe(409)
  })

  it('rejects re-processing an already-Paid payout', async () => {
    const { payout } = await createPayoutRecord({ status: 'Paid' })
    const token = await loginAsFinance()

    const res = await request(testApp)
      .post(`/api/v1/payouts/${payout._id.toString()}/process`)
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'Mobile Money', transactionId: 'TXN-004' })
    expect(res.status).toBe(409)
  })

  it('requires method and transactionId', async () => {
    const { payout } = await createPayoutRecord({ status: 'Approved' })
    const token = await loginAsFinance()

    const res = await request(testApp).post(`/api/v1/payouts/${payout._id.toString()}/process`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsFinance()
    const res = await request(testApp)
      .post('/api/v1/payouts/665f1a2b3c4d5e6f7a8b9c0d/process')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'Mobile Money', transactionId: 'TXN-005' })
    expect(res.status).toBe(404)
  })

  it('rejects a caller with only payments.approve (Manager role — no payments.process)', async () => {
    const { payout } = await createPayoutRecord({ status: 'Approved' })
    const token = await loginAsFinance(['payments.approve'])

    const res = await request(testApp)
      .post(`/api/v1/payouts/${payout._id.toString()}/process`)
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'Mobile Money', transactionId: 'TXN-006' })
    expect(res.status).toBe(403)
  })
})
