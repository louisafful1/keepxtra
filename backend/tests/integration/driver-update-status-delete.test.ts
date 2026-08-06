import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createDriverRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['drivers.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('PATCH /api/v1/drivers/:id', () => {
  it('updates basic fields', async () => {
    const driver = await createDriverRecord({ name: 'Old Name' })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/drivers/${driver._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ name: 'New Name' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('New Name')
  })

  it('writes a "Driver Updated" audit log entry', async () => {
    const driver = await createDriverRecord()
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/drivers/${driver._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ name: 'Renamed' })

    const entries = await AuditLog.find({ entityType: 'Driver', entityId: driver._id.toString(), action: 'Driver Updated' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects an attempt to set status directly', async () => {
    const driver = await createDriverRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/drivers/${driver._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ status: 'Suspended' })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).patch('/api/v1/drivers/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`).send({ name: 'X' })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/drivers/:id/status', () => {
  it('changes the status', async () => {
    const driver = await createDriverRecord({ status: 'Available' })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/drivers/${driver._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Off Duty' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Off Duty')
  })

  it('writes a "Driver Status Changed" audit log entry', async () => {
    const driver = await createDriverRecord()
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/drivers/${driver._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Suspended' })

    const entries = await AuditLog.find({ entityType: 'Driver', entityId: driver._id.toString(), action: 'Driver Status Changed' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects an invalid status', async () => {
    const driver = await createDriverRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/drivers/${driver._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Retired' })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/drivers/665f1a2b3c4d5e6f7a8b9c0d/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Available' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/drivers/:id', () => {
  it('soft-deletes a driver who is not On Trip', async () => {
    const driver = await createDriverRecord({ status: 'Available' })
    const token = await loginAsOperations()

    const res = await request(testApp).delete(`/api/v1/drivers/${driver._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)

    const getRes = await request(testApp).get(`/api/v1/drivers/${driver._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(getRes.status).toBe(404)
  })

  it('refuses to delete a driver who is On Trip', async () => {
    const driver = await createDriverRecord({ status: 'On Trip' })
    const token = await loginAsOperations()

    const res = await request(testApp).delete(`/api/v1/drivers/${driver._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('writes a "Driver Deleted" audit log entry', async () => {
    const driver = await createDriverRecord({ status: 'Available' })
    const token = await loginAsOperations()

    await request(testApp).delete(`/api/v1/drivers/${driver._id.toString()}`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Driver', entityId: driver._id.toString(), action: 'Driver Deleted' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).delete('/api/v1/drivers/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/drivers/:id/restore', () => {
  it('restores a soft-deleted driver', async () => {
    const driver = await createDriverRecord({ status: 'Available' })
    const token = await loginAsOperations()
    await request(testApp).delete(`/api/v1/drivers/${driver._id.toString()}`).set('Authorization', `Bearer ${token}`)

    const res = await request(testApp).post(`/api/v1/drivers/${driver._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('writes a "Driver Restored" audit log entry', async () => {
    const driver = await createDriverRecord({ status: 'Available' })
    const token = await loginAsOperations()
    await request(testApp).delete(`/api/v1/drivers/${driver._id.toString()}`).set('Authorization', `Bearer ${token}`)

    await request(testApp).post(`/api/v1/drivers/${driver._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Driver', entityId: driver._id.toString(), action: 'Driver Restored' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for a driver that was never deleted', async () => {
    const driver = await createDriverRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/drivers/${driver._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
