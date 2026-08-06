import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createColdRoomRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['warehouses.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/cold-rooms/stats/summary', () => {
  it('aggregates capacity/occupancy/alerts across every cold room', async () => {
    await createColdRoomRecord({
      capacityKg: 8000,
      currentOccupancyKg: 2000,
      status: 'Active',
      targetTemperatureMinC: 0,
      targetTemperatureMaxC: 4,
      currentTemperatureC: 2,
    })
    await createColdRoomRecord({
      capacityKg: 6000,
      currentOccupancyKg: 1000,
      status: 'Under Maintenance',
      targetTemperatureMinC: 0,
      targetTemperatureMaxC: 4,
      currentTemperatureC: 15,
    })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/cold-rooms/stats/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.coldRoomCount).toBe(2)
    expect(res.body.data.totalCapacityKg).toBe(14000)
    expect(res.body.data.totalOccupancyKg).toBe(3000)
    expect(res.body.data.availableCapacityKg).toBe(11000)
    expect(res.body.data.byStatus.Active).toBe(1)
    expect(res.body.data.byStatus['Under Maintenance']).toBe(1)
    expect(res.body.data.withActiveAlerts).toBe(1)
  })

  it('returns zeroed stats when there are no cold rooms', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/cold-rooms/stats/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.coldRoomCount).toBe(0)
    expect(res.body.data.utilizationPercent).toBe(0)
    expect(res.body.data.withActiveAlerts).toBe(0)
  })

  it('rejects a caller without warehouses.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/cold-rooms/stats/summary').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})
