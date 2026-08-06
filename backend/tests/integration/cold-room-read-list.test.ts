import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createColdRoomRecord, createWarehouseRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['warehouses.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/cold-rooms', () => {
  it('lists every cold room', async () => {
    await createColdRoomRecord()
    await createColdRoomRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/cold-rooms').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('searches by name', async () => {
    await createColdRoomRecord({ name: 'Blast Freezer' })
    await createColdRoomRecord({ name: 'Chiller Room' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/cold-rooms').query({ search: 'Blast' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].name).toBe('Blast Freezer')
  })

  it('filters by warehouseId', async () => {
    const warehouseA = await createWarehouseRecord()
    const warehouseB = await createWarehouseRecord()
    await createColdRoomRecord({ warehouseId: warehouseA._id })
    await createColdRoomRecord({ warehouseId: warehouseB._id })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/cold-rooms').query({ warehouseId: warehouseA._id.toString() }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('filters by status', async () => {
    await createColdRoomRecord({ status: 'Active' })
    await createColdRoomRecord({ status: 'Under Maintenance' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/cold-rooms').query({ status: 'Under Maintenance' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('paginates results', async () => {
    await createColdRoomRecord()
    await createColdRoomRecord()
    await createColdRoomRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/cold-rooms').query({ page: 1, pageSize: 2 }).set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.totalPages).toBe(2)
  })

  it('rejects a caller without warehouses.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/cold-rooms').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/cold-rooms')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/cold-rooms/:id', () => {
  it('returns the cold room', async () => {
    const { coldRoom } = await createColdRoomRecord({ name: 'Blast Freezer' })
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Blast Freezer')
  })

  it('surfaces an alert when the current reading is outside the target range', async () => {
    const { coldRoom } = await createColdRoomRecord({
      targetTemperatureMinC: 0,
      targetTemperatureMaxC: 4,
      currentTemperatureC: 9,
    })
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/cold-rooms/${coldRoom._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.body.data.alerts).toHaveLength(1)
    expect(res.body.data.alerts[0]).toContain('Temperature')
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/cold-rooms/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
