import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createFarmerRecord } from '../utils/factories'
import { Farmer } from '../../src/models/farmer.model'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys = ['farmers.delete']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', 'Password123')
}

describe('DELETE /api/v1/farmers/:id', () => {
  it('soft-deletes the farmer', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).delete(`/api/v1/farmers/${farmer._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)

    const raw = await Farmer.findById(farmer._id).exec()
    expect(raw?.isDeleted).toBe(true)
    expect(raw?.deletedAt).not.toBeNull()

    const getRes = await request(testApp).get(`/api/v1/farmers/${farmer._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(getRes.status).toBe(404)
  })

  it('writes a "Farmer Deleted" audit log entry', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations()

    await request(testApp).delete(`/api/v1/farmers/${farmer._id.toString()}`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Farmer', entityId: farmer._id.toString(), action: 'Farmer Deleted' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects the request without the farmers.delete permission', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations(['farmers.read'])

    const res = await request(testApp).delete(`/api/v1/farmers/${farmer._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).delete('/api/v1/farmers/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const { farmer } = await createFarmerRecord()
    const res = await request(testApp).delete(`/api/v1/farmers/${farmer._id.toString()}`)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/v1/farmers/:id/restore', () => {
  it('restores a soft-deleted farmer', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations()
    await request(testApp).delete(`/api/v1/farmers/${farmer._id.toString()}`).set('Authorization', `Bearer ${token}`)

    const res = await request(testApp).post(`/api/v1/farmers/${farmer._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBeDefined()

    const raw = await Farmer.findById(farmer._id).exec()
    expect(raw?.isDeleted).toBe(false)
    expect(raw?.deletedAt).toBeNull()
  })

  it('writes a "Farmer Restored" audit log entry', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations()
    await request(testApp).delete(`/api/v1/farmers/${farmer._id.toString()}`).set('Authorization', `Bearer ${token}`)

    await request(testApp).post(`/api/v1/farmers/${farmer._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Farmer', entityId: farmer._id.toString(), action: 'Farmer Restored' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 when the farmer is not currently deleted', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/farmers/${farmer._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('returns 404 for an id that has never existed', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/farmers/665f1a2b3c4d5e6f7a8b9c0d/restore').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const { farmer } = await createFarmerRecord()
    const res = await request(testApp).post(`/api/v1/farmers/${farmer._id.toString()}/restore`)
    expect(res.status).toBe(401)
  })

  it('rejects the request without the farmers.delete permission', async () => {
    const { farmer } = await createFarmerRecord()
    const deleteToken = await loginAsOperations()
    await request(testApp).delete(`/api/v1/farmers/${farmer._id.toString()}`).set('Authorization', `Bearer ${deleteToken}`)

    await createActiveUser({ email: 'readonly@keepxtra.com', permissionKeys: ['farmers.read'] })
    const readOnlyToken = await loginAndGetToken('readonly@keepxtra.com', 'Password123')

    const res = await request(testApp)
      .post(`/api/v1/farmers/${farmer._id.toString()}/restore`)
      .set('Authorization', `Bearer ${readOnlyToken}`)
    expect(res.status).toBe(403)
  })
})
