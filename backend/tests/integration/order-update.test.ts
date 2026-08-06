import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createOrderRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['sales.create']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('PATCH /api/v1/orders/:id', () => {
  it('updates non-financial fields on a draft order', async () => {
    const { order } = await createOrderRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .patch(`/api/v1/orders/${order._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ deliveryAddress: '5 New Address', notes: 'Deliver before noon' })

    expect(res.status).toBe(200)
    expect(res.body.data.deliveryAddress).toBe('5 New Address')
    expect(res.body.data.notes).toBe('Deliver before noon')
  })

  it('writes an "Order Updated" audit log entry', async () => {
    const { order } = await createOrderRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/orders/${order._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ notes: 'x' })

    const entries = await AuditLog.find({ entityType: 'Order', entityId: order._id.toString(), action: 'Order Updated' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects editing a Confirmed order', async () => {
    const { order } = await createOrderRecord({ status: 'Confirmed' })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/orders/${order._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ notes: 'x' })
    expect(res.status).toBe(409)
  })

  it('rejects an attempt to set items directly', async () => {
    const { order } = await createOrderRecord({ status: 'Draft' })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/orders/${order._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ items: [] })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).patch('/api/v1/orders/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`).send({ notes: 'x' })
    expect(res.status).toBe(404)
  })

  it('rejects a caller without sales.create', async () => {
    const { order } = await createOrderRecord({ status: 'Draft' })
    const token = await loginAsOperations([])

    const res = await request(testApp).patch(`/api/v1/orders/${order._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ notes: 'x' })
    expect(res.status).toBe(403)
  })
})
