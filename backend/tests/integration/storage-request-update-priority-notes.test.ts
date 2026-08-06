import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createStorageRequestRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['storage-requests.update']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('PATCH /api/v1/storage-requests/:id', () => {
  it('lets an Operations user update content fields while still editable', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft', quantity: 100 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 750 })

    expect(res.status).toBe(200)
    expect(res.body.data.quantity).toBe(750)
  })

  it('writes an "Updated" audit log entry with before/after values', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft', quantity: 100 })
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/storage-requests/${sr._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ quantity: 750 })

    const entries = await AuditLog.find({ entityType: 'StorageRequest', entityId: sr._id.toString(), action: 'Updated' }).exec()
    expect(entries).toHaveLength(1)
    expect(entries[0]!.previousValue).toContain('100')
    expect(entries[0]!.newValue).toContain('750')
  })

  it('becomes read-only once Approved', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Approved' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 750 })
    expect(res.status).toBe(409)
  })

  it('rejects requestNumber, farmerId, or status in the body', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Approved' })
    expect(res.status).toBe(422)
  })

  it('rejects the request without the storage-requests.update permission', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const token = await loginAsOperations(['storage-requests.read'])

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 750 })
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/storage-requests/665f1a2b3c4d5e6f7a8b9c0d')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 750 })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/storage-requests/:id/priority', () => {
  it('changes the priority', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft', priority: 'Normal' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}/priority`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'Urgent' })

    expect(res.status).toBe(200)
    expect(res.body.data.priority).toBe('Urgent')
  })

  it('writes a "Priority Changed" audit log entry', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft', priority: 'Normal' })
    const token = await loginAsOperations()

    await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}/priority`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'Urgent' })

    const entries = await AuditLog.find({ entityType: 'StorageRequest', entityId: sr._id.toString(), action: 'Priority Changed' }).exec()
    expect(entries).toHaveLength(1)
    expect(entries[0]!.previousValue).toBe('Normal')
    expect(entries[0]!.newValue).toBe('Urgent')
  })

  it('becomes read-only once Approved', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Approved' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}/priority`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'Urgent' })
    expect(res.status).toBe(409)
  })

  it('rejects an invalid priority value', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}/priority`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'Immediate' })
    expect(res.status).toBe(422)
  })

  it('rejects the request without the storage-requests.update permission', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const token = await loginAsOperations(['storage-requests.read'])

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}/priority`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'Urgent' })
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/storage-requests/665f1a2b3c4d5e6f7a8b9c0d/priority')
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'Urgent' })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/storage-requests/:id/internal-notes', () => {
  it('sets internal notes', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}/internal-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ internalNotes: 'Called farmer to confirm quantity' })

    expect(res.status).toBe(200)
    expect(res.body.data.internalNotes).toBe('Called farmer to confirm quantity')
  })

  it('writes an "Internal Notes Updated" audit log entry', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}/internal-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ internalNotes: 'Note' })

    const entries = await AuditLog.find({
      entityType: 'StorageRequest',
      entityId: sr._id.toString(),
      action: 'Internal Notes Updated',
    }).exec()
    expect(entries).toHaveLength(1)
  })

  it('stays editable even once Approved — the one exception to read-only', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Approved' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}/internal-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ internalNotes: 'Still editable' })
    expect(res.status).toBe(200)
    expect(res.body.data.internalNotes).toBe('Still editable')
  })

  it('rejects empty internal notes', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}/internal-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ internalNotes: '' })
    expect(res.status).toBe(422)
  })

  it('rejects the request without the storage-requests.update permission', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    const token = await loginAsOperations(['storage-requests.read'])

    const res = await request(testApp)
      .patch(`/api/v1/storage-requests/${sr._id.toString()}/internal-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ internalNotes: 'x' })
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/storage-requests/665f1a2b3c4d5e6f7a8b9c0d/internal-notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ internalNotes: 'x' })
    expect(res.status).toBe(404)
  })
})
