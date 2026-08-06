import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createPayoutRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['payments.approve']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('POST /api/v1/payouts/:id/approve', () => {
  it('approves a Pending payout', async () => {
    const { payout } = await createPayoutRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/payouts/${payout._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Approved')
    expect(res.body.data.approvedAt).not.toBeNull()
    expect(res.body.data.approvedBy).not.toBeNull()
  })

  it('writes a "Payout Approved" audit log entry', async () => {
    const { payout } = await createPayoutRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/payouts/${payout._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Payout', entityId: payout._id.toString(), action: 'Payout Approved' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects approving an already-Approved payout', async () => {
    const { payout } = await createPayoutRecord({ status: 'Approved' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/payouts/${payout._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/payouts/665f1a2b3c4d5e6f7a8b9c0d/approve').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects a caller without payments.approve', async () => {
    const { payout } = await createPayoutRecord({ status: 'Pending' })
    const token = await loginAsOperations([])

    const res = await request(testApp).post(`/api/v1/payouts/${payout._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})

describe('POST /api/v1/payouts/:id/reject', () => {
  it('rejects a Pending payout with a reason', async () => {
    const { payout } = await createPayoutRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/payouts/${payout._id.toString()}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Duplicate payout' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Rejected')
    expect(res.body.data.rejectionReason).toBe('Duplicate payout')
  })

  it('rejects an Approved payout with a reason', async () => {
    const { payout } = await createPayoutRecord({ status: 'Approved' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/payouts/${payout._id.toString()}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Farmer details incorrect' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Rejected')
  })

  it('writes a "Payout Rejected" audit log entry', async () => {
    const { payout } = await createPayoutRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/payouts/${payout._id.toString()}/reject`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })

    const entries = await AuditLog.find({ entityType: 'Payout', entityId: payout._id.toString(), action: 'Payout Rejected' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('requires a rejection reason', async () => {
    const { payout } = await createPayoutRecord({ status: 'Pending' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/payouts/${payout._id.toString()}/reject`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(422)
  })

  it('rejects rejecting an already-Paid payout', async () => {
    const { payout } = await createPayoutRecord({ status: 'Paid' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/payouts/${payout._id.toString()}/reject`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/payouts/665f1a2b3c4d5e6f7a8b9c0d/reject').set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
    expect(res.status).toBe(404)
  })

  it('rejects a caller without payments.approve', async () => {
    const { payout } = await createPayoutRecord({ status: 'Pending' })
    const token = await loginAsOperations([])

    const res = await request(testApp).post(`/api/v1/payouts/${payout._id.toString()}/reject`).set('Authorization', `Bearer ${token}`).send({ reason: 'x' })
    expect(res.status).toBe(403)
  })
})
