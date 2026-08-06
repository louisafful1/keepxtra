import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createStorageRequestRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'
import {
  STORAGE_REQUEST_EVENTS,
  storageRequestEvents,
  type StorageRequestApprovedEvent,
  type StorageRequestRejectedEvent,
} from '../../src/events/storageRequest.events'

async function loginAsOperations(permissionKeys: string[] = ['storage-requests.review']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('POST /api/v1/storage-requests/:id/approve', () => {
  it('approves a Submitted request', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Approved')
    expect(res.body.data.approvedAt).not.toBeNull()
    expect(res.body.data.approvedBy).not.toBeNull()
  })

  it('approves a request Under Review', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Under Review' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('writes an "Approved" audit log entry', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'StorageRequest', entityId: sr._id.toString(), action: 'Approved' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('emits storageRequest.approved with the farmer’s linked userId', async () => {
    const { request: sr, user } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    const received: StorageRequestApprovedEvent[] = []
    const listener = (event: StorageRequestApprovedEvent) => received.push(event)
    storageRequestEvents.on(STORAGE_REQUEST_EVENTS.APPROVED, listener)

    try {
      await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)
      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ storageRequestId: sr._id.toString(), farmerUserId: user._id.toString() })
    } finally {
      storageRequestEvents.off(STORAGE_REQUEST_EVENTS.APPROVED, listener)
    }
  })

  it('rejects the request without the storage-requests.review permission', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations(['storage-requests.read'])

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('rejects approving a Draft request', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('rejects re-approving an already-Approved request', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Approved' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/storage-requests/665f1a2b3c4d5e6f7a8b9c0d/approve')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/v1/storage-requests/:id/reject', () => {
  it('rejects a Submitted request with a reason', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/storage-requests/${sr._id.toString()}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Produce below grade' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Rejected')
    expect(res.body.data.rejectionReason).toBe('Produce below grade')
  })

  it('writes a "Rejected" audit log entry', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/storage-requests/${sr._id.toString()}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Produce below grade' })

    const entries = await AuditLog.find({ entityType: 'StorageRequest', entityId: sr._id.toString(), action: 'Rejected' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('emits storageRequest.rejected with the reason', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    const received: StorageRequestRejectedEvent[] = []
    const listener = (event: StorageRequestRejectedEvent) => received.push(event)
    storageRequestEvents.on(STORAGE_REQUEST_EVENTS.REJECTED, listener)

    try {
      await request(testApp)
        .post(`/api/v1/storage-requests/${sr._id.toString()}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Produce below grade' })
      expect(received).toHaveLength(1)
      expect(received[0]?.reason).toBe('Produce below grade')
    } finally {
      storageRequestEvents.off(STORAGE_REQUEST_EVENTS.REJECTED, listener)
    }
  })

  it('requires a rejection reason', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/reject`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(422)
  })

  it('rejects the request without the storage-requests.review permission', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations(['storage-requests.read'])

    const res = await request(testApp)
      .post(`/api/v1/storage-requests/${sr._id.toString()}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'x' })
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/storage-requests/665f1a2b3c4d5e6f7a8b9c0d/reject')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'x' })
    expect(res.status).toBe(404)
  })

  it('a rejected request can never proceed to approval', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/storage-requests/${sr._id.toString()}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'x' })

    const res = await request(testApp).post(`/api/v1/storage-requests/${sr._id.toString()}/approve`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })
})
