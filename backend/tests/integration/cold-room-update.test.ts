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

describe('PATCH /api/v1/cold-rooms/:id', () => {
  it('updates basic fields', async () => {
    const { coldRoom } = await createColdRoomRecord({ name: 'Old Name' })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ name: 'New Name' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('New Name')
  })

  it('writes a "Cold Room Updated" audit log entry', async () => {
    const { coldRoom } = await createColdRoomRecord()
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ name: 'Renamed' })

    const entries = await AuditLog.find({ entityType: 'ColdRoom', entityId: coldRoom._id.toString(), action: 'Cold Room Updated' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects reducing capacity below the currently recorded occupancy', async () => {
    const { coldRoom } = await createColdRoomRecord({ capacityKg: 8000, currentOccupancyKg: 5000 })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ capacityKg: 1000 })
    expect(res.status).toBe(409)
  })

  it('rejects a temperature range where the new max is below the existing min', async () => {
    const { coldRoom } = await createColdRoomRecord({ targetTemperatureMinC: 0, targetTemperatureMaxC: 4 })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ targetTemperatureMaxC: -5 })
    expect(res.status).toBe(409)
  })

  it('rejects a humidity range where the new max is below the existing min', async () => {
    const { coldRoom } = await createColdRoomRecord({ targetHumidityMinPercent: 85, targetHumidityMaxPercent: 95 })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ targetHumidityMaxPercent: 10 })
    expect(res.status).toBe(409)
  })

  it('rejects an attempt to set warehouseId directly', async () => {
    const { coldRoom, warehouse } = await createColdRoomRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString() })
    expect(res.status).toBe(422)
  })

  it('rejects an attempt to set status directly', async () => {
    const { coldRoom } = await createColdRoomRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ status: 'Inactive' })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).patch('/api/v1/cold-rooms/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`).send({ name: 'X' })
    expect(res.status).toBe(404)
  })

  it('rejects a caller without warehouses.manage', async () => {
    const { coldRoom } = await createColdRoomRecord()
    const token = await loginAsOperations([])

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ name: 'X' })
    expect(res.status).toBe(403)
  })
})
