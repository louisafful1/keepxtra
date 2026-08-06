import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createWarehouseRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['warehouses.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/warehouses', () => {
  it('lists every warehouse', async () => {
    await createWarehouseRecord()
    await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/warehouses').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('searches by name', async () => {
    await createWarehouseRecord({ name: 'Kumasi Cold Store', warehouseCode: 'WH-88001' })
    await createWarehouseRecord({ name: 'Accra Cold Store' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/warehouses').query({ search: 'Kumasi' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].name).toBe('Kumasi Cold Store')
  })

  it('filters by status', async () => {
    await createWarehouseRecord({ status: 'Active' })
    await createWarehouseRecord({ status: 'Under Maintenance' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/warehouses').query({ status: 'Under Maintenance' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].status).toBe('Under Maintenance')
  })

  it('filters by region and district', async () => {
    await createWarehouseRecord({ region: 'Ashanti', district: 'Kumasi Metro' })
    await createWarehouseRecord({ region: 'Eastern', district: 'Nsawam-Adoagyiri' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/warehouses').query({ region: 'Ashanti' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('paginates results', async () => {
    await createWarehouseRecord()
    await createWarehouseRecord()
    await createWarehouseRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/warehouses').query({ page: 1, pageSize: 2 }).set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.totalPages).toBe(2)
  })

  it('rejects a caller without warehouses.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/warehouses').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/warehouses')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/warehouses/:id', () => {
  it('returns the warehouse', async () => {
    const warehouse = await createWarehouseRecord({ name: 'Tema Cold Store' })
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/warehouses/${warehouse._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Tema Cold Store')
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/warehouses/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
