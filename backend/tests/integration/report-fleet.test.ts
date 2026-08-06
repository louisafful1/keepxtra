import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createDriverRecord, createVehicleRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsReportsViewer() {
  await createActiveUser({ email: 'reports-viewer4@keepxtra.com', permissionKeys: ['reports.view'] })
  return loginAndGetToken('reports-viewer4@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

async function loginAsFleetManager() {
  await createActiveUser({ email: 'fleet-manager@keepxtra.com', permissionKeys: ['fleet.manage'] })
  return loginAndGetToken('fleet-manager@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/reports/fleet', () => {
  it('reports vehicle status breakdown, driver availability, and maintenance/fuel costs', async () => {
    const vehicle = await createVehicleRecord({ status: 'Available' })
    await createVehicleRecord({ status: 'Under Maintenance' })
    await createDriverRecord({ status: 'Available' })
    await createDriverRecord({ status: 'Off Duty' })

    const fleetToken = await loginAsFleetManager()
    await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/maintenance`)
      .set('Authorization', `Bearer ${fleetToken}`)
      .send({ type: 'Service', description: 'Oil change', costAmount: 150, performedAt: new Date().toISOString() })
    await request(testApp)
      .post(`/api/v1/vehicles/${vehicle._id.toString()}/fuel`)
      .set('Authorization', `Bearer ${fleetToken}`)
      .send({ litres: 40, costAmount: 250, odometerKm: 1000, recordedAt: new Date().toISOString() })

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/fleet').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalMaintenanceCost).toBeGreaterThanOrEqual(150)
    expect(res.body.data.totalFuelCost).toBeGreaterThanOrEqual(250)
    expect(res.body.data.totalDrivers).toBeGreaterThanOrEqual(2)
    expect(res.body.data.availableDrivers).toBeGreaterThanOrEqual(1)
    const vehiclesByStatus = res.body.data.vehiclesByStatus as { status: string; count: number }[]
    const availableRow = vehiclesByStatus.find((v) => v.status === 'Available')
    expect(availableRow?.count).toBeGreaterThanOrEqual(1)
  })
})
