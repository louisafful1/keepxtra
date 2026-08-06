import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createPayoutRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['payments.approve']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/payouts', () => {
  it('lists every payout', async () => {
    await createPayoutRecord()
    await createPayoutRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/payouts').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('searches by payout code', async () => {
    const { payout } = await createPayoutRecord({ payoutCode: 'PO-77001' })
    await createPayoutRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/payouts').query({ search: 'PO-77001' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).toBe(payout._id.toString())
  })

  it('filters by status', async () => {
    await createPayoutRecord({ status: 'Pending' })
    await createPayoutRecord({ status: 'Approved' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/payouts').query({ status: 'Approved' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('filters by farmerId', async () => {
    const { payout } = await createPayoutRecord()
    await createPayoutRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/payouts').query({ farmerId: payout.farmerId.toString() }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).toBe(payout._id.toString())
  })

  it('rejects a caller without payments.approve', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/payouts').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/payouts')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/payouts/:id', () => {
  it('returns the payout', async () => {
    const { payout } = await createPayoutRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/payouts/${payout._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(payout._id.toString())
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/payouts/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
