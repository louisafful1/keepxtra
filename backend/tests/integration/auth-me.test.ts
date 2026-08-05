import { describe, expect, it } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { testApp } from '../utils/testApp'
import { createActiveUser, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAndGetToken(email: string) {
  const res = await request(testApp).post('/api/v1/auth/login').send({ email, password: DEFAULT_TEST_PASSWORD })
  return res.body.data.accessToken as string
}

describe('GET /api/v1/auth/me', () => {
  it("returns the current user's profile, role, and permissions", async () => {
    const { user } = await createActiveUser({
      email: 'kwame@keepxtra.com',
      name: 'Kwame Asante',
      permissionKeys: ['farmers.view', 'inventory.view'],
    })
    const accessToken = await loginAndGetToken('kwame@keepxtra.com')

    const res = await request(testApp).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      id: user._id.toString(),
      email: 'kwame@keepxtra.com',
      name: 'Kwame Asante',
    })
    expect(res.body.data.permissions).toEqual(expect.arrayContaining(['farmers.view', 'inventory.view']))
    expect(res.body.data.roleName).toEqual(expect.any(String))
    expect(res.body.data.passwordHash).toBeUndefined()
  })

  it('reflects a role change on the very next request (permissions are never cached in the token)', async () => {
    const { user } = await createActiveUser({ email: 'kwame@keepxtra.com', permissionKeys: ['farmers.view'] })
    const accessToken = await loginAndGetToken('kwame@keepxtra.com')

    const first = await request(testApp).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`)
    expect(first.body.data.permissions).toEqual(['farmers.view'])

    const { createTestPermission, createTestRole } = await import('../utils/factories')
    const newPermission = await createTestPermission({ key: 'settings.roles' })
    const newRole = await createTestRole({ permissions: [newPermission._id] })
    user.roleId = newRole._id
    await user.save()

    const second = await request(testApp).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`)
    expect(second.body.data.permissions).toEqual(['settings.roles'])
  })

  it('rejects a request with no Authorization header', async () => {
    const res = await request(testApp).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })

  it('rejects a malformed/garbage token', async () => {
    const res = await request(testApp).get('/api/v1/auth/me').set('Authorization', 'Bearer not-a-real-token')
    expect(res.status).toBe(401)
  })

  it('rejects an expired token', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })
    const expiredToken = jwt.sign(
      { sub: 'irrelevant', tokenVersion: 0, exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_ACCESS_SECRET!,
    )

    const res = await request(testApp).get('/api/v1/auth/me').set('Authorization', `Bearer ${expiredToken}`)
    expect(res.status).toBe(401)
  })

  it('rejects a token signed with the wrong secret', async () => {
    const forgedToken = jwt.sign({ sub: 'irrelevant', tokenVersion: 0 }, 'the-wrong-secret-entirely', { expiresIn: '15m' })

    const res = await request(testApp).get('/api/v1/auth/me').set('Authorization', `Bearer ${forgedToken}`)
    expect(res.status).toBe(401)
  })

  it('rejects a token for a user that no longer exists', async () => {
    const forgedToken = jwt.sign(
      { sub: '665f1a2b3c4d5e6f7a8b9c0d', tokenVersion: 0 },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m' },
    )

    const res = await request(testApp).get('/api/v1/auth/me').set('Authorization', `Bearer ${forgedToken}`)
    expect(res.status).toBe(401)
  })

  it('rejects a token for a suspended account', async () => {
    const { user } = await createActiveUser({ email: 'kwame@keepxtra.com' })
    const accessToken = await loginAndGetToken('kwame@keepxtra.com')

    user.status = 'Suspended'
    await user.save()

    const res = await request(testApp).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(403)
  })
})
