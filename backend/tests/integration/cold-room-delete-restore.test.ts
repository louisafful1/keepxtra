import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createColdRoomRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['warehouses.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('DELETE /api/v1/cold-rooms/:id', () => {
  it('soft-deletes an empty cold room', async () => {
    const { coldRoom } = await createColdRoomRecord({ currentOccupancyKg: 0 })
    const token = await loginAsOperations()

    const res = await request(testApp).delete(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)

    const getRes = await request(testApp).get(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(getRes.status).toBe(404)
  })

  it('writes a "Cold Room Deleted" audit log entry', async () => {
    const { coldRoom } = await createColdRoomRecord({ currentOccupancyKg: 0 })
    const token = await loginAsOperations()

    await request(testApp).delete(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'ColdRoom', entityId: coldRoom._id.toString(), action: 'Cold Room Deleted' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('refuses to delete a cold room with recorded occupancy', async () => {
    const { coldRoom } = await createColdRoomRecord({ currentOccupancyKg: 500 })
    const token = await loginAsOperations()

    const res = await request(testApp).delete(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).delete('/api/v1/cold-rooms/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects a caller without warehouses.manage', async () => {
    const { coldRoom } = await createColdRoomRecord()
    const token = await loginAsOperations([])

    const res = await request(testApp).delete(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})

describe('POST /api/v1/cold-rooms/:id/restore', () => {
  it('restores a soft-deleted cold room', async () => {
    const { coldRoom } = await createColdRoomRecord({ currentOccupancyKg: 0 })
    const token = await loginAsOperations()
    await request(testApp).delete(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`)

    const res = await request(testApp).post(`/api/v1/cold-rooms/${coldRoom._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)

    const getRes = await request(testApp).get(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(getRes.status).toBe(200)
  })

  it('writes a "Cold Room Restored" audit log entry', async () => {
    const { coldRoom } = await createColdRoomRecord({ currentOccupancyKg: 0 })
    const token = await loginAsOperations()
    await request(testApp).delete(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`)

    await request(testApp).post(`/api/v1/cold-rooms/${coldRoom._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'ColdRoom', entityId: coldRoom._id.toString(), action: 'Cold Room Restored' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for a cold room that was never deleted', async () => {
    const { coldRoom } = await createColdRoomRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/cold-rooms/${coldRoom._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
