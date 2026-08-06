import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createDriverRecord, createVehicleRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { Driver } from '../../src/models/driver.model'
import { Vehicle } from '../../src/models/vehicle.model'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['drivers.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('POST /api/v1/drivers/:id/assign-vehicle', () => {
  it('assigns a vehicle to a driver, setting both sides of the relationship', async () => {
    const driver = await createDriverRecord()
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/drivers/${driver._id.toString()}/assign-vehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId: vehicle._id.toString() })

    expect(res.status).toBe(200)
    expect(res.body.data.assignedVehicleId).toBe(vehicle._id.toString())

    const updatedVehicle = await Vehicle.findById(vehicle._id).exec()
    expect(updatedVehicle?.assignedDriverId?.toString()).toBe(driver._id.toString())
  })

  it('unassigns when vehicleId is null, clearing both sides', async () => {
    const vehicle = await createVehicleRecord()
    const driver = await createDriverRecord({ assignedVehicleId: vehicle._id })
    await Vehicle.updateOne({ _id: vehicle._id }, { $set: { assignedDriverId: driver._id } }).exec()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/drivers/${driver._id.toString()}/assign-vehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId: null })

    expect(res.status).toBe(200)
    expect(res.body.data.assignedVehicleId).toBeNull()

    const updatedVehicle = await Vehicle.findById(vehicle._id).exec()
    expect(updatedVehicle?.assignedDriverId).toBeNull()
  })

  it('reassigning a vehicle already held by another driver frees the previous driver', async () => {
    const vehicle = await createVehicleRecord()
    const driverA = await createDriverRecord({ assignedVehicleId: vehicle._id })
    await Vehicle.updateOne({ _id: vehicle._id }, { $set: { assignedDriverId: driverA._id } }).exec()
    const driverB = await createDriverRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/drivers/${driverB._id.toString()}/assign-vehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId: vehicle._id.toString() })
    expect(res.status).toBe(200)

    const updatedDriverA = await Driver.findById(driverA._id).exec()
    expect(updatedDriverA?.assignedVehicleId).toBeNull()

    const updatedVehicle = await Vehicle.findById(vehicle._id).exec()
    expect(updatedVehicle?.assignedDriverId?.toString()).toBe(driverB._id.toString())
  })

  it('assigning a driver a new vehicle frees whatever they previously had', async () => {
    const oldVehicle = await createVehicleRecord()
    const driver = await createDriverRecord({ assignedVehicleId: oldVehicle._id })
    await Vehicle.updateOne({ _id: oldVehicle._id }, { $set: { assignedDriverId: driver._id } }).exec()
    const newVehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/drivers/${driver._id.toString()}/assign-vehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId: newVehicle._id.toString() })

    const updatedOldVehicle = await Vehicle.findById(oldVehicle._id).exec()
    expect(updatedOldVehicle?.assignedDriverId).toBeNull()
  })

  it('writes a "Driver Vehicle Assignment Changed" audit log entry', async () => {
    const driver = await createDriverRecord()
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/drivers/${driver._id.toString()}/assign-vehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId: vehicle._id.toString() })

    const entries = await AuditLog.find({ entityType: 'Driver', entityId: driver._id.toString(), action: 'Driver Vehicle Assignment Changed' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for an unknown vehicleId', async () => {
    const driver = await createDriverRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/drivers/${driver._id.toString()}/assign-vehicle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId: '665f1a2b3c4d5e6f7a8b9c0d' })
    expect(res.status).toBe(404)
  })

  it('returns 404 for an unknown driver id', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/drivers/665f1a2b3c4d5e6f7a8b9c0d/assign-vehicle')
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId: vehicle._id.toString() })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/drivers/:id/trips', () => {
  it('increments totalTripsCompleted and sets performanceRating', async () => {
    const driver = await createDriverRecord({ totalTripsCompleted: 5 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/drivers/${driver._id.toString()}/trips`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4.5 })

    expect(res.status).toBe(200)
    expect(res.body.data.totalTripsCompleted).toBe(6)
    expect(res.body.data.performanceRating).toBe(4.5)
  })

  it('preserves the existing rating when none is given', async () => {
    const driver = await createDriverRecord({ totalTripsCompleted: 2, performanceRating: 3 })
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/drivers/${driver._id.toString()}/trips`).set('Authorization', `Bearer ${token}`).send({})

    expect(res.status).toBe(200)
    expect(res.body.data.totalTripsCompleted).toBe(3)
    expect(res.body.data.performanceRating).toBe(3)
  })

  it('writes a "Driver Trip Logged" audit log entry', async () => {
    const driver = await createDriverRecord()
    const token = await loginAsOperations()

    await request(testApp).post(`/api/v1/drivers/${driver._id.toString()}/trips`).set('Authorization', `Bearer ${token}`).send({})

    const entries = await AuditLog.find({ entityType: 'Driver', entityId: driver._id.toString(), action: 'Driver Trip Logged' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects a rating outside 0-5', async () => {
    const driver = await createDriverRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/drivers/${driver._id.toString()}/trips`).set('Authorization', `Bearer ${token}`).send({ rating: 6 })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/drivers/665f1a2b3c4d5e6f7a8b9c0d/trips').set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(404)
  })
})
