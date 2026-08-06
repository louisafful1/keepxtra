import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createVehicleRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['fleet.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('PATCH /api/v1/vehicles/:id', () => {
  it('updates basic fields', async () => {
    const vehicle = await createVehicleRecord({ type: 'Van' })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ type: 'Pickup Truck' })
    expect(res.status).toBe(200)
    expect(res.body.data.type).toBe('Pickup Truck')
  })

  it('writes a "Vehicle Updated" audit log entry', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ type: 'Van' })

    const entries = await AuditLog.find({ entityType: 'Vehicle', entityId: vehicle._id.toString(), action: 'Vehicle Updated' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects an attempt to set status directly', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ status: 'Under Maintenance' })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).patch('/api/v1/vehicles/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`).send({ type: 'Van' })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/vehicles/:id/status', () => {
  it('changes the status', async () => {
    const vehicle = await createVehicleRecord({ status: 'Available' })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/vehicles/${vehicle._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Under Maintenance' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Under Maintenance')
  })

  it('writes a "Vehicle Status Changed" audit log entry', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/vehicles/${vehicle._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Out of Service' })

    const entries = await AuditLog.find({ entityType: 'Vehicle', entityId: vehicle._id.toString(), action: 'Vehicle Status Changed' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects an invalid status', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/vehicles/${vehicle._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Parked' })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/vehicles/665f1a2b3c4d5e6f7a8b9c0d/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Available' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/vehicles/:id', () => {
  it('soft-deletes a vehicle that is not On Trip', async () => {
    const vehicle = await createVehicleRecord({ status: 'Available' })
    const token = await loginAsOperations()

    const res = await request(testApp).delete(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)

    const getRes = await request(testApp).get(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(getRes.status).toBe(404)
  })

  it('writes a "Vehicle Deleted" audit log entry', async () => {
    const vehicle = await createVehicleRecord({ status: 'Available' })
    const token = await loginAsOperations()

    await request(testApp).delete(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Vehicle', entityId: vehicle._id.toString(), action: 'Vehicle Deleted' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('refuses to delete a vehicle that is On Trip', async () => {
    const vehicle = await createVehicleRecord({ status: 'On Trip' })
    const token = await loginAsOperations()

    const res = await request(testApp).delete(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).delete('/api/v1/vehicles/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/vehicles/:id/restore', () => {
  it('restores a soft-deleted vehicle', async () => {
    const vehicle = await createVehicleRecord({ status: 'Available' })
    const token = await loginAsOperations()
    await request(testApp).delete(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`)

    const res = await request(testApp).post(`/api/v1/vehicles/${vehicle._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('writes a "Vehicle Restored" audit log entry', async () => {
    const vehicle = await createVehicleRecord({ status: 'Available' })
    const token = await loginAsOperations()
    await request(testApp).delete(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`)

    await request(testApp).post(`/api/v1/vehicles/${vehicle._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Vehicle', entityId: vehicle._id.toString(), action: 'Vehicle Restored' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for a vehicle that was never deleted', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/vehicles/${vehicle._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
