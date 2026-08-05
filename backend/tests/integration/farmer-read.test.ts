import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createFarmerRecord, createTestRole } from '../utils/factories'

async function loginAsOperations(permissionKeys = ['farmers.read']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', 'Password123')
}

async function createFarmerUser(overrides: Parameters<typeof createActiveUser>[0] = {}) {
  const role = await createTestRole({ scope: 'farmer', permissions: [] })
  return createActiveUser({ ...overrides, roleId: role._id })
}

describe('GET /api/v1/farmers/:id', () => {
  it('returns the farmer for an Operations user with farmers.read', async () => {
    const { farmer } = await createFarmerRecord({ firstName: 'Ama', lastName: 'Owusu' })
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/farmers/${farmer._id.toString()}`).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.fullName).toBe('Ama Owusu')
  })

  it("allows a farmer to view their own record without farmers.read", async () => {
    const { user, password } = await createFarmerUser()
    const { farmer } = await createFarmerRecord({ userId: user._id })
    const token = await loginAndGetToken(user.email, password)

    const res = await request(testApp).get(`/api/v1/farmers/${farmer._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('forbids a farmer from viewing a different farmer’s record', async () => {
    const { farmer } = await createFarmerRecord()
    const { user, password } = await createFarmerUser()
    const token = await loginAndGetToken(user.email, password)

    const res = await request(testApp).get(`/api/v1/farmers/${farmer._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/farmers/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const { farmer } = await createFarmerRecord()
    const res = await request(testApp).get(`/api/v1/farmers/${farmer._id.toString()}`)
    expect(res.status).toBe(401)
  })

  it('rejects a malformed id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/farmers/not-a-valid-id').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(422)
  })
})

describe('GET /api/v1/farmers/me', () => {
  it("returns the caller's own farmer profile", async () => {
    const { user, password } = await createFarmerUser()
    await createFarmerRecord({ userId: user._id, farmName: 'My Own Farm' })
    const token = await loginAndGetToken(user.email, password)

    const res = await request(testApp).get('/api/v1/farmers/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.farmName).toBe('My Own Farm')
  })

  it('returns 404 when the account has no linked farmer profile', async () => {
    const { user, password } = await createActiveUser({ permissionKeys: [] })
    const token = await loginAndGetToken(user.email, password)

    const res = await request(testApp).get('/api/v1/farmers/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/farmers/me')
    expect(res.status).toBe(401)
  })
})
