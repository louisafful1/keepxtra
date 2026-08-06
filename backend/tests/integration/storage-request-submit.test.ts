import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createFarmerRecord, createStorageRequestRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'
import { STORAGE_REQUEST_EVENTS, storageRequestEvents, type StorageRequestSubmittedEvent } from '../../src/events/storageRequest.events'

async function loginAsFarmer() {
  const { farmer, user } = await createFarmerRecord()
  const token = await loginAndGetToken(user.email, DEFAULT_TEST_PASSWORD)
  return { farmer, user, token }
}

describe('POST /api/v1/storage-requests/:id/submit', () => {
  it('moves a Draft request to Submitted and stamps requestedAt', async () => {
    const { farmer, token } = await loginAsFarmer()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id, status: 'Draft' })

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/submit`).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Submitted')
    expect(res.body.data.requestedAt).not.toBeNull()
  })

  it('writes a "Submitted" audit log entry', async () => {
    const { farmer, token } = await loginAsFarmer()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id, status: 'Draft' })

    await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/submit`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'StorageRequest', entityId: sr._id.toString(), action: 'Submitted' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('emits storageRequest.submitted on the event bus', async () => {
    const { farmer, token } = await loginAsFarmer()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id, status: 'Draft' })

    const received: StorageRequestSubmittedEvent[] = []
    const listener = (event: StorageRequestSubmittedEvent) => received.push(event)
    storageRequestEvents.on(STORAGE_REQUEST_EVENTS.SUBMITTED, listener)

    try {
      await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/submit`).set('Authorization', `Bearer ${token}`)
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ storageRequestId: sr._id.toString(), requestNumber: sr.requestNumber })
    } finally {
      storageRequestEvents.off(STORAGE_REQUEST_EVENTS.SUBMITTED, listener)
    }
  })

  it('forbids a farmer from submitting another farmer’s request', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const { token } = await loginAsFarmer()

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/submit`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('rejects submitting a request that is not in Draft', async () => {
    const { farmer, token } = await loginAsFarmer()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id, status: 'Submitted' })

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/submit`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const { token } = await loginAsFarmer()
    const res = await request(testApp)
      .post('/api/v1/storage-requests/665f1a2b3c4d5e6f7a8b9c0d/submit')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/submit`)
    expect(res.status).toBe(401)
  })
})
