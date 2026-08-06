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

describe('PATCH /api/v1/cold-rooms/:id/status', () => {
  it('changes the status', async () => {
    const { coldRoom } = await createColdRoomRecord({ status: 'Active' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Under Maintenance' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Under Maintenance')
    expect(res.body.data.isAvailable).toBe(false)
  })

  it('writes a "Cold Room Status Changed" audit log entry', async () => {
    const { coldRoom } = await createColdRoomRecord()
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Inactive' })

    const entries = await AuditLog.find({ entityType: 'ColdRoom', entityId: coldRoom._id.toString(), action: 'Cold Room Status Changed' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects an invalid status', async () => {
    const { coldRoom } = await createColdRoomRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Closed' })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/cold-rooms/665f1a2b3c4d5e6f7a8b9c0d/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Inactive' })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/cold-rooms/:id/readings', () => {
  it('records a temperature reading within range with no alert', async () => {
    const { coldRoom } = await createColdRoomRecord({ targetTemperatureMinC: 0, targetTemperatureMaxC: 4 })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/readings`).set('Authorization', `Bearer ${token}`).send({ temperatureC: 2 })

    expect(res.status).toBe(200)
    expect(res.body.data.currentTemperatureC).toBe(2)
    expect(res.body.data.alerts).toEqual([])
    expect(res.body.data.lastReadingAt).not.toBeNull()
  })

  it('records a reading above the target range and surfaces an alert', async () => {
    const { coldRoom } = await createColdRoomRecord({ targetTemperatureMinC: 0, targetTemperatureMaxC: 4 })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/readings`).set('Authorization', `Bearer ${token}`).send({ temperatureC: 12 })

    expect(res.status).toBe(200)
    expect(res.body.data.alerts).toHaveLength(1)
  })

  it('records a reading below the target range and surfaces an alert', async () => {
    const { coldRoom } = await createColdRoomRecord({ targetTemperatureMinC: 0, targetTemperatureMaxC: 4 })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/readings`).set('Authorization', `Bearer ${token}`).send({ temperatureC: -5 })

    expect(res.status).toBe(200)
    expect(res.body.data.alerts).toHaveLength(1)
  })

  it('records a humidity reading below its target range', async () => {
    const { coldRoom } = await createColdRoomRecord({ targetHumidityMinPercent: 85, targetHumidityMaxPercent: 95 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/readings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ humidityPercent: 60 })

    expect(res.status).toBe(200)
    expect(res.body.data.currentHumidityPercent).toBe(60)
    expect(res.body.data.alerts).toHaveLength(1)
    expect(res.body.data.alerts[0]).toContain('Humidity')
  })

  it('records a humidity reading above its target range', async () => {
    const { coldRoom } = await createColdRoomRecord({ targetHumidityMinPercent: 85, targetHumidityMaxPercent: 95 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/readings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ humidityPercent: 99 })

    expect(res.status).toBe(200)
    expect(res.body.data.alerts).toHaveLength(1)
    expect(res.body.data.alerts[0]).toContain('Humidity')
  })

  it('records only a humidity reading within range, leaving temperature unset, with no alert', async () => {
    const { coldRoom } = await createColdRoomRecord({ targetHumidityMinPercent: 85, targetHumidityMaxPercent: 95 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/readings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ humidityPercent: 90 })

    expect(res.status).toBe(200)
    expect(res.body.data.currentTemperatureC).toBeNull()
    expect(res.body.data.alerts).toEqual([])
  })

  it('records both temperature and humidity within range in a single call, with no alert', async () => {
    const { coldRoom } = await createColdRoomRecord({
      targetTemperatureMinC: 0,
      targetTemperatureMaxC: 4,
      targetHumidityMinPercent: 85,
      targetHumidityMaxPercent: 95,
    })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/readings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ temperatureC: 2, humidityPercent: 90 })

    expect(res.status).toBe(200)
    expect(res.body.data.alerts).toEqual([])
  })

  it('writes an "Alert" audit log entry when the reading is out of range', async () => {
    const { coldRoom } = await createColdRoomRecord({ targetTemperatureMinC: 0, targetTemperatureMaxC: 4 })
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/readings`).set('Authorization', `Bearer ${token}`).send({ temperatureC: 20 })

    const entries = await AuditLog.find({ entityType: 'ColdRoom', entityId: coldRoom._id.toString(), action: 'Reading Recorded — Alert' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('writes a plain "Reading Recorded" audit log entry when within range', async () => {
    const { coldRoom } = await createColdRoomRecord({ targetTemperatureMinC: 0, targetTemperatureMaxC: 4 })
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/readings`).set('Authorization', `Bearer ${token}`).send({ temperatureC: 2 })

    const entries = await AuditLog.find({ entityType: 'ColdRoom', entityId: coldRoom._id.toString(), action: 'Reading Recorded' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects a body with neither temperatureC nor humidityPercent', async () => {
    const { coldRoom } = await createColdRoomRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/readings`).set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/cold-rooms/665f1a2b3c4d5e6f7a8b9c0d/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ temperatureC: 2 })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/cold-rooms/:id/occupancy', () => {
  it('adjusts occupancy', async () => {
    const { coldRoom } = await createColdRoomRecord({ capacityKg: 8000 })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/occupancy`).set('Authorization', `Bearer ${token}`).send({ occupancyKg: 3000 })
    expect(res.status).toBe(200)
    expect(res.body.data.currentOccupancyKg).toBe(3000)
    expect(res.body.data.availableCapacityKg).toBe(5000)
  })

  it('writes a "Cold Room Occupancy Adjusted" audit log entry', async () => {
    const { coldRoom } = await createColdRoomRecord({ capacityKg: 8000 })
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/occupancy`).set('Authorization', `Bearer ${token}`).send({ occupancyKg: 3000 })

    const entries = await AuditLog.find({ entityType: 'ColdRoom', entityId: coldRoom._id.toString(), action: 'Cold Room Occupancy Adjusted' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects occupancy exceeding capacity', async () => {
    const { coldRoom } = await createColdRoomRecord({ capacityKg: 8000 })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/occupancy`).set('Authorization', `Bearer ${token}`).send({ occupancyKg: 9000 })
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/cold-rooms/665f1a2b3c4d5e6f7a8b9c0d/occupancy')
      .set('Authorization', `Bearer ${token}`)
      .send({ occupancyKg: 100 })
    expect(res.status).toBe(404)
  })

  it('rejects a caller without warehouses.manage', async () => {
    const { coldRoom } = await createColdRoomRecord()
    const token = await loginAsOperations([])

    const res = await request(testApp).patch(`/api/v1/cold-rooms/${coldRoom._id.toString()}/occupancy`).set('Authorization', `Bearer ${token}`).send({ occupancyKg: 100 })
    expect(res.status).toBe(403)
  })
})
