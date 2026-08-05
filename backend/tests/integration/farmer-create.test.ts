import { describe, expect, it, vi, afterEach } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createFarmerRecord } from '../utils/factories'
import { mailService } from '../../src/services/mail.service'
import { User } from '../../src/models/user.model'
import { AuditLog } from '../../src/models/auditLog.model'

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    firstName: 'Kwame',
    lastName: 'Asante',
    phone: '+233 24 000 0001',
    email: 'kwame.asante@keepxtra.com',
    farmName: 'Asante Farms',
    farmLocation: 'Nsawam Farm Gate',
    district: 'Nsawam-Adoagyiri',
    region: 'Eastern',
    primaryCrops: ['Tomatoes', 'Maize'],
    preferredPaymentMethod: 'Mobile Money',
    mobileMoneyDetails: { provider: 'MTN', phoneNumber: '+233 24 000 0001' },
    ...overrides,
  }
}

async function loginAsOperations(permissionKeys = ['farmers.create']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', 'Password123')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/v1/farmers', () => {
  it('registers a farmer, creates a linked pending user, and emails a set-password link', async () => {
    const spy = vi.spyOn(mailService, 'sendPasswordResetEmail').mockResolvedValue()
    const token = await loginAsOperations()

    const res = await request(testApp).post('/api/v1/farmers').set('Authorization', `Bearer ${token}`).send(validPayload())

    expect(res.status).toBe(201)
    expect(res.body.data.farmerNumber).toMatch(/^FRM-\d{5}$/)
    expect(res.body.data.fullName).toBe('Kwame Asante')
    expect(res.body.data.status).toBe('Active')

    const linkedUser = await User.findById(res.body.data.userId).exec()
    expect(linkedUser?.status).toBe('Pending Review')
    expect(linkedUser?.email).toBe('kwame.asante@keepxtra.com')

    expect(spy).toHaveBeenCalledOnce()
    expect(spy.mock.calls[0]![0]).toBe('kwame.asante@keepxtra.com')
  })

  it('generates sequential farmer numbers', async () => {
    vi.spyOn(mailService, 'sendPasswordResetEmail').mockResolvedValue()
    const token = await loginAsOperations()

    const first = await request(testApp)
      .post('/api/v1/farmers')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ email: 'first@keepxtra.com', phone: '+233 24 111 1111' }))
    const second = await request(testApp)
      .post('/api/v1/farmers')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ email: 'second@keepxtra.com', phone: '+233 24 222 2222' }))

    const firstNum = Number((first.body.data.farmerNumber as string).split('-')[1])
    const secondNum = Number((second.body.data.farmerNumber as string).split('-')[1])
    expect(secondNum).toBe(firstNum + 1)
  })

  it('writes a "Farmer Created" audit log entry', async () => {
    vi.spyOn(mailService, 'sendPasswordResetEmail').mockResolvedValue()
    const token = await loginAsOperations()

    const res = await request(testApp).post('/api/v1/farmers').set('Authorization', `Bearer ${token}`).send(validPayload())

    const entries = await AuditLog.find({ entityType: 'Farmer', entityId: res.body.data.id }).exec()
    expect(entries).toHaveLength(1)
    expect(entries[0]!.action).toBe('Farmer Created')
    expect(entries[0]!.userName).toBe('Test User')
  })

  it('rejects a duplicate phone or email (business-level duplicate detection)', async () => {
    vi.spyOn(mailService, 'sendPasswordResetEmail').mockResolvedValue()
    await createFarmerRecord({ phone: '+233 24 000 0001', email: 'existing@keepxtra.com' })
    const token = await loginAsOperations()

    const res = await request(testApp)
      .post('/api/v1/farmers')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ email: 'brandnew@keepxtra.com' })) // phone collides

    expect(res.status).toBe(409)
  })

  it('rejects an email already used by an existing user account', async () => {
    vi.spyOn(mailService, 'sendPasswordResetEmail').mockResolvedValue()
    await createActiveUser({ email: 'kwame.asante@keepxtra.com' })
    const token = await loginAsOperations()

    const res = await request(testApp).post('/api/v1/farmers').set('Authorization', `Bearer ${token}`).send(validPayload())
    expect(res.status).toBe(409)
  })

  it('rejects the request without the farmers.create permission', async () => {
    const token = await loginAsOperations(['farmers.read'])

    const res = await request(testApp).post('/api/v1/farmers').set('Authorization', `Bearer ${token}`).send(validPayload())
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).post('/api/v1/farmers').send(validPayload())
    expect(res.status).toBe(401)
  })

  it('rejects a payload missing required fields', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).post('/api/v1/farmers').set('Authorization', `Bearer ${token}`).send({ firstName: 'Kwame' })
    expect(res.status).toBe(422)
  })

  it('rejects an invalid email', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/farmers')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ email: 'not-an-email' }))
    expect(res.status).toBe(422)
  })

  it('rejects an invalid phone number', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/farmers')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ phone: 'abc' }))
    expect(res.status).toBe(422)
  })

  it('rejects an empty primaryCrops array', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/farmers')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ primaryCrops: [] }))
    expect(res.status).toBe(422)
  })

  it('requires bankDetails when the payment method is Bank Transfer', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/farmers')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ preferredPaymentMethod: 'Bank Transfer', mobileMoneyDetails: undefined }))
    expect(res.status).toBe(422)
  })

  it('requires mobileMoneyDetails when the payment method is Mobile Money', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp)
      .post('/api/v1/farmers')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload({ mobileMoneyDetails: undefined }))
    expect(res.status).toBe(422)
  })
})
