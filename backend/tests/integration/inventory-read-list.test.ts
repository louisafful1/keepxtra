import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createInventoryRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['inventory.view']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/inventory', () => {
  it('lists every inventory record', async () => {
    await createInventoryRecord()
    await createInventoryRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/inventory').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('searches by inventory code', async () => {
    const { inventory } = await createInventoryRecord({ inventoryCode: 'INV-77001' })
    await createInventoryRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/inventory').query({ search: 'INV-77001' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).toBe(inventory._id.toString())
  })

  it('filters by status', async () => {
    await createInventoryRecord({ status: 'Pending Placement' })
    await createInventoryRecord({ status: 'In Stock' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/inventory').query({ status: 'In Stock' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('filters by the expired flag', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await createInventoryRecord({ status: 'In Stock', expiryDate: yesterday })
    await createInventoryRecord({ status: 'In Stock', expiryDate: nextMonth })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/inventory').query({ expired: 'true' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].isExpired).toBe(true)
  })

  it('filters by the nearExpiry flag', async () => {
    const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await createInventoryRecord({ status: 'In Stock', expiryDate: in2Days })
    await createInventoryRecord({ status: 'In Stock', expiryDate: nextMonth })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/inventory').query({ nearExpiry: 'true' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].isNearExpiry).toBe(true)
  })

  it('filters by the lowStock flag', async () => {
    await createInventoryRecord({ status: 'In Stock', initialQuantity: 1000, currentQuantity: 100 })
    await createInventoryRecord({ status: 'In Stock', initialQuantity: 1000, currentQuantity: 900 })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/inventory').query({ lowStock: 'true' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].isLowStock).toBe(true)
  })

  it('paginates results', async () => {
    await createInventoryRecord()
    await createInventoryRecord()
    await createInventoryRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/inventory').query({ page: 1, pageSize: 2 }).set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.totalPages).toBe(2)
  })

  it('rejects a caller without inventory.view', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/inventory').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/inventory')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/inventory/:id', () => {
  it('returns the inventory record with computed fields', async () => {
    const { inventory } = await createInventoryRecord({ currentQuantity: 480, reservedQuantity: 80, valuePerUnit: 2 })
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/inventory/${inventory._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.availableQuantity).toBe(400)
    expect(res.body.data.totalValue).toBe(960)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/inventory/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
