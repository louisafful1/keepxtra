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

function validPayload(overrides: Record<string, unknown> = {}) {
  return { name: 'Golden Spoon Restaurant', type: 'Restaurant', phone: '+233 24 555 5555', address: '12 Liberation Road, Accra', ...overrides }
}

describe('POST /api/v1/customers', () => {
  it('creates a customer with an auto-generated code', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/customers').set('Authorization', `Bearer ${token}`).send(validPayload())

    expect(res.status).toBe(201)
    expect(res.body.data.customerCode).toMatch(/^CUS-\d{5}$/)
    expect(res.body.data.status).toBe('Active')
  })

  it('writes a "Customer Created" audit log entry', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/customers').set('Authorization', `Bearer ${token}`).send(validPayload())

    const entries = await AuditLog.find({ entityType: 'Customer', entityId: res.body.data.id, action: 'Customer Created' }).exec()
    expect(entries).toHaveLength(1)
  })

  it('rejects an invalid type', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/customers').set('Authorization', `Bearer ${token}`).send(validPayload({ type: 'Farm' }))
    expect(res.status).toBe(422)
  })

  it('rejects an incomplete payload', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/customers').set('Authorization', `Bearer ${token}`).send({ name: 'X' })
    expect(res.status).toBe(422)
  })

  it('rejects a caller without sales.create', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).post('/api/v1/customers').set('Authorization', `Bearer ${token}`).send(validPayload())
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).post('/api/v1/customers').send(validPayload())
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/customers', () => {
  it('lists every customer', async () => {
    await createCustomerRecord()
    await createCustomerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/customers').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('searches by name', async () => {
    const customer = await createCustomerRecord({ name: 'Savannah Hotel' })
    await createCustomerRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/customers').query({ search: 'Savannah' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).toBe(customer._id.toString())
  })

  it('filters by type', async () => {
    await createCustomerRecord({ type: 'Hotel' })
    await createCustomerRecord({ type: 'Wholesaler' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/customers').query({ type: 'Hotel' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('rejects a caller without sales.create', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/customers').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})

describe('GET /api/v1/customers/:id', () => {
  it('returns the customer', async () => {
    const customer = await createCustomerRecord({ name: 'Savannah Hotel' })
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/customers/${customer._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Savannah Hotel')
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/customers/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
