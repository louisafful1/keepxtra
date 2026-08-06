import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createCustomerRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { AuditLog } from '../../src/models/auditLog.model'

async function loginAsOperations(permissionKeys: string[] = ['sales.create']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('PATCH /api/v1/customers/:id', () => {
  it('updates basic fields', async () => {
    const customer = await createCustomerRecord({ name: 'Old Name' })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/customers/${customer._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ name: 'New Name' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('New Name')
  })

  it('writes a "Customer Updated" audit log entry', async () => {
    const customer = await createCustomerRecord()
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/customers/${customer._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ name: 'Renamed' })

    const entries = await AuditLog.find({ entityType: 'Customer', entityId: customer._id.toString(), action: 'Customer Updated' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects an attempt to set status directly', async () => {
    const customer = await createCustomerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/customers/${customer._id.toString()}`).set('Authorization', `Bearer ${token}`).send({ status: 'Inactive' })
    expect(res.status).toBe(422)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).patch('/api/v1/customers/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`).send({ name: 'X' })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/customers/:id/status', () => {
  it('changes the status', async () => {
    const customer = await createCustomerRecord({ status: 'Active' })
    const token = await loginAsOperations()

    const res = await request(testApp).patch(`/api/v1/customers/${customer._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Inactive' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('Inactive')
  })

  it('writes a "Customer Status Changed" audit log entry', async () => {
    const customer = await createCustomerRecord()
    const token = await loginAsOperations()

    await request(testApp).patch(`/api/v1/customers/${customer._id.toString()}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Inactive' })

    const entries = await AuditLog.find({ entityType: 'Customer', entityId: customer._id.toString(), action: 'Customer Status Changed' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .patch('/api/v1/customers/665f1a2b3c4d5e6f7a8b9c0d/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Inactive' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/customers/:id', () => {
  it('soft-deletes a customer', async () => {
    const customer = await createCustomerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).delete(`/api/v1/customers/${customer._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)

    const getRes = await request(testApp).get(`/api/v1/customers/${customer._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(getRes.status).toBe(404)
  })

  it('writes a "Customer Deleted" audit log entry', async () => {
    const customer = await createCustomerRecord()
    const token = await loginAsOperations()

    await request(testApp).delete(`/api/v1/customers/${customer._id.toString()}`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Customer', entityId: customer._id.toString(), action: 'Customer Deleted' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).delete('/api/v1/customers/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/customers/:id/restore', () => {
  it('restores a soft-deleted customer', async () => {
    const customer = await createCustomerRecord()
    const token = await loginAsOperations()
    await request(testApp).delete(`/api/v1/customers/${customer._id.toString()}`).set('Authorization', `Bearer ${token}`)

    const res = await request(testApp).post(`/api/v1/customers/${customer._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('writes a "Customer Restored" audit log entry', async () => {
    const customer = await createCustomerRecord()
    const token = await loginAsOperations()
    await request(testApp).delete(`/api/v1/customers/${customer._id.toString()}`).set('Authorization', `Bearer ${token}`)

    await request(testApp).post(`/api/v1/customers/${customer._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)

    const entries = await AuditLog.find({ entityType: 'Customer', entityId: customer._id.toString(), action: 'Customer Restored' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('returns 404 for a customer that was never deleted', async () => {
    const customer = await createCustomerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).post(`/api/v1/customers/${customer._id.toString()}/restore`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
