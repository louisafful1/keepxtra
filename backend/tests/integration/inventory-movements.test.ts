import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createInventoryRecord, createWarehouseRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['inventory.view', 'inventory.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/inventory/:id/movements', () => {
  it('lists movements newest first', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord()
    const token = await loginAsOperations()

    await request(testApp)
      .post(`/api/v1/inventory/${inventory._id.toString()}/receive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: warehouse._id.toString(), shelfLifeDays: 14 })
    await request(testApp)
      .patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantityChange: -10, reason: 'x' })

    const res = await request(testApp).get(`/api/v1/inventory/${inventory._id.toString()}/movements`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
    expect(res.body.data[0].type).toBe('Adjustment')
    expect(res.body.data[1].type).toBe('Receipt')
  })

  it('paginates movements', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500 })
    const token = await loginAsOperations()

    for (let i = 0; i < 3; i += 1) {
      await request(testApp)
        .patch(`/api/v1/inventory/${inventory._id.toString()}/adjust`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantityChange: -1, reason: `adjustment ${i}` })
    }

    const res = await request(testApp)
      .get(`/api/v1/inventory/${inventory._id.toString()}/movements`)
      .query({ page: 1, pageSize: 2 })
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.total).toBe(3)
  })

  it('returns 404 for an unknown inventory id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/inventory/665f1a2b3c4d5e6f7a8b9c0d/movements').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects a caller without inventory.view', async () => {
    const { inventory } = await createInventoryRecord()
    const token = await loginAsOperations([])

    const res = await request(testApp).get(`/api/v1/inventory/${inventory._id.toString()}/movements`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})
