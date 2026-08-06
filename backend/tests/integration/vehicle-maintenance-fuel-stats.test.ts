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

describe('POST /api/v1/vehicles/:id/maintenance', () => {
  it('logs a maintenance record and advances currentMileageKm', async () => {
    const vehicle = await createVehicleRecord({ currentMileageKm: 50000 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/maintenance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'Repair', description: 'Replaced brake pads', costAmount: 450, odometerKm: 52000, performedAt: new Date().toISOString() })

    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('Repair')

    const getRes = await request(testApp).get(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(getRes.body.data.currentMileageKm).toBe(52000)
  })

  it('does not regress currentMileageKm if the odometer reading is lower than what is on file', async () => {
    const vehicle = await createVehicleRecord({ currentMileageKm: 50000 })
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/maintenance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'Inspection', description: 'Routine check', odometerKm: 40000, performedAt: new Date().toISOString() })

    const getRes = await request(testApp).get(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(getRes.body.data.currentMileageKm).toBe(50000)
  })

  it('writes a "Vehicle Maintenance Logged" audit log entry', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/maintenance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'Service', description: 'Oil change', performedAt: new Date().toISOString() })

    const entries = await AuditLog.find({ entityType: 'Vehicle', entityId: vehicle._id.toString(), action: 'Vehicle Maintenance Logged' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for an unknown vehicle id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/vehicles/665f1a2b3c4d5e6f7a8b9c0d/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'Service', description: 'Oil change', performedAt: new Date().toISOString() })
    expect(res.status).toBe(404)
  })

  it('rejects an incomplete payload', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/vehicles/${vehicle._id.toString()}/maintenance`).set('Authorization', `Bearer ${token}`).send({ type: 'Service' })
    expect(res.status).toBe(422)
  })
})

describe('GET /api/v1/vehicles/:id/maintenance', () => {
  it('lists maintenance records newest first', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/maintenance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'Service', description: 'First', performedAt: new Date(Date.now() - 10000).toISOString() })
    await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/maintenance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'Repair', description: 'Second', performedAt: new Date().toISOString() })

    const res = await request(testApp).get(`/api/v1/vehicles/${vehicle._id.toString()}/maintenance`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
    expect(res.body.data[0].description).toBe('Second')
  })

  it('returns 404 for an unknown vehicle id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/vehicles/665f1a2b3c4d5e6f7a8b9c0d/maintenance').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/vehicles/:id/fuel', () => {
  it('logs a fuel record and advances currentMileageKm', async () => {
    const vehicle = await createVehicleRecord({ currentMileageKm: 50000 })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/fuel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ litres: 60, costAmount: 480, odometerKm: 50200, recordedAt: new Date().toISOString() })

    expect(res.status).toBe(201)
    expect(res.body.data.litres).toBe(60)

    const getRes = await request(testApp).get(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(getRes.body.data.currentMileageKm).toBe(50200)
  })

  it('does not regress currentMileageKm if the odometer reading is lower than what is on file', async () => {
    const vehicle = await createVehicleRecord({ currentMileageKm: 50000 })
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/fuel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ litres: 20, costAmount: 150, odometerKm: 100, recordedAt: new Date().toISOString() })

    const getRes = await request(testApp).get(`/api/v1/vehicles/${vehicle._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(getRes.body.data.currentMileageKm).toBe(50000)
  })

  it('writes a "Vehicle Fuel Logged" audit log entry', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/fuel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ litres: 60, costAmount: 480, odometerKm: 100, recordedAt: new Date().toISOString() })

    const entries = await AuditLog.find({ entityType: 'Vehicle', entityId: vehicle._id.toString(), action: 'Vehicle Fuel Logged' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects a non-positive litres', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/fuel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ litres: 0, costAmount: 480, odometerKm: 100, recordedAt: new Date().toISOString() })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown vehicle id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/vehicles/665f1a2b3c4d5e6f7a8b9c0d/fuel')
      .set('Authorization', `Bearer ${token}`)
      .send({ litres: 60, costAmount: 480, odometerKm: 100, recordedAt: new Date().toISOString() })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/vehicles/:id/fuel', () => {
  it('lists fuel records newest first', async () => {
    const vehicle = await createVehicleRecord()
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/fuel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ litres: 30, costAmount: 200, odometerKm: 100, recordedAt: new Date(Date.now() - 10000).toISOString() })
    await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/fuel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ litres: 60, costAmount: 480, odometerKm: 200, recordedAt: new Date().toISOString() })

    const res = await request(testApp).get(`/api/v1/vehicles/${vehicle._id.toString()}/fuel`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
    expect(res.body.data[0].litres).toBe(60)
  })

  it('returns 404 for an unknown vehicle id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/vehicles/665f1a2b3c4d5e6f7a8b9c0d/fuel').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/vehicles/stats/summary', () => {
  it('aggregates fleet status counts, capacity, utilization, and costs', async () => {
    const v1 = await createVehicleRecord({ status: 'On Trip', capacityKg: 5000 })
    await createVehicleRecord({ status: 'Available', capacityKg: 3000 })
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/vehicles/${v1._id.toString()}/fuel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ litres: 60, costAmount: 480, odometerKm: 100, recordedAt: new Date().toISOString() })
    await request(testApp)
      .post(`/api/v1/vehicles/${v1._id.toString()}/maintenance`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'Service', description: 'Oil change', costAmount: 150, performedAt: new Date().toISOString() })

    const res = await request(testApp).get('/api/v1/vehicles/stats/summary').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.vehicleCount).toBe(2)
    expect(res.body.data.byVehicleStatus['On Trip']).toBe(1)
    expect(res.body.data.byVehicleStatus.Available).toBe(1)
    expect(res.body.data.totalCapacityKg).toBe(8000)
    expect(res.body.data.utilizationPercent).toBe(50)
    expect(res.body.data.totalFuelCostAmount).toBe(480)
    expect(res.body.data.totalMaintenanceCostAmount).toBe(150)
  })

  it('returns zeroed stats when there are no vehicles', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/vehicles/stats/summary').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.vehicleCount).toBe(0)
    expect(res.body.data.utilizationPercent).toBe(0)
  })

  it('rejects a caller without fleet.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/vehicles/stats/summary').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})
