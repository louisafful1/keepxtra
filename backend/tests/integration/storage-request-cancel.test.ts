import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createFarmerRecord, createStorageRequestRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsFarmer() {
  const { farmer, user } = await createFarmerRecord()
  const token = await loginAndGetToken(user.email, DEFAULT_TEST_PASSWORD)
  return { farmer, user, token }
}

describe('POST /api/v1/storage-requests/:id/cancel', () => {
  it.each(['Draft', 'Submitted', 'Under Review'] as const)('cancels a request in %s status', async (status) => {
    const { farmer, token } = await loginAsFarmer()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id, status })

    const res = await request(testApp)
      .post(`/api/v1/storage-requests/${sr._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Changed my mind' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Cancelled')
    expect(res.body.data.cancellationReason).toBe('Changed my mind')
  })

  it('cancels without a reason (optional)', async () => {
    const { farmer, token } = await loginAsFarmer()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id, status: 'Draft' })

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(200)
    expect(res.body.data.cancellationReason).toBeNull()
  })

  it('writes a "Cancelled" audit log entry', async () => {
    const { farmer, token } = await loginAsFarmer()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id, status: 'Draft' })

    await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({})

    const entries = await AuditLog.find({ entityType: 'StorageRequest', entityId: sr._id.toString(), action: 'Cancelled' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('cannot be cancelled once Approved', async () => {
    const { farmer, token } = await loginAsFarmer()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id, status: 'Approved' })

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(409)
  })

  it('a cancelled request can never be reactivated (re-cancel or re-submit both fail)', async () => {
    const { farmer, token } = await loginAsFarmer()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id, status: 'Draft' })

    await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({})

    const resubmit = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/submit`).set('Authorization', `Bearer ${token}`)
    expect(resubmit.status).toBe(409)

    const recancel = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({})
    expect(recancel.status).toBe(409)
  })

  it('forbids a farmer from cancelling another farmer’s request', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const { token } = await loginAsFarmer()

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/cancel`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const { token } = await loginAsFarmer()
    const res = await request(testApp).post('/api/v1/storage-requests/665f1a2b3c4d5e6f7a8b9c0d/cancel').set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/cancel`).send({})
    expect(res.status).toBe(401)
  })
})
