import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { createActiveUser, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { User } from '../../src/models/user.model'

describe('POST /api/v1/auth/login', () => {
  it('logs in successfully with the correct email and password', async () => {
    const { user } = await createActiveUser({
      email: 'kwame@keepxtra.com',
      name: 'Kwame Asante',
      permissionKeys: ['farmers.view'],
    })

    const res = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: DEFAULT_TEST_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user).toMatchObject({
      id: user._id.toString(),
      email: 'kwame@keepxtra.com',
      name: 'Kwame Asante',
    })
    expect(res.body.data.user.role.permissions).toContain('farmers.view')
    expect(res.body.data.accessToken).toEqual(expect.any(String))
    expect(res.body.data.expiresAt).toEqual(expect.any(Number))
    // Never leak the password hash.
    expect(res.body.data.user.passwordHash).toBeUndefined()
  })

  it('is case-insensitive on email', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })

    const res = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'KWAME@KeepXtra.com', password: DEFAULT_TEST_PASSWORD })

    expect(res.status).toBe(200)
  })

  it('sets an httpOnly, path-scoped refresh token cookie', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })

    const res = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: DEFAULT_TEST_PASSWORD })

    const setCookie = res.headers['set-cookie'] as unknown as string[]
    expect(setCookie).toBeDefined()
    const cookie = setCookie.find((c) => c.startsWith('keepxtra_refresh_token='))
    expect(cookie).toBeDefined()
    expect(cookie).toMatch(/HttpOnly/)
    expect(cookie).toMatch(/SameSite=Strict/)
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/)
  })

  it('records lastLoginAt', async () => {
    const { user } = await createActiveUser({ email: 'kwame@keepxtra.com' })
    expect(user.lastLoginAt).toBeNull()

    await request(testApp).post('/api/v1/auth/login').send({ email: 'kwame@keepxtra.com', password: DEFAULT_TEST_PASSWORD })

    const updated = await User.findById(user._id).exec()
    expect(updated?.lastLoginAt).not.toBeNull()
  })

  it('rejects an unknown email', async () => {
    const res = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@keepxtra.com', password: DEFAULT_TEST_PASSWORD })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects an invalid password', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })

    const res = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: 'WrongPassword1' })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects a locked (suspended) account', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com', status: 'Suspended' })

    const res = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: DEFAULT_TEST_PASSWORD })

    expect(res.status).toBe(403)
    expect(res.body.error.message).toMatch(/suspended/i)
  })

  it('rejects an inactive (pending review) account', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com', status: 'Pending Review' })

    const res = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: DEFAULT_TEST_PASSWORD })

    expect(res.status).toBe(403)
    expect(res.body.error.message).toMatch(/pending review/i)
  })

  it('rejects an unverified account', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com', emailVerifiedAt: null })

    const res = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: DEFAULT_TEST_PASSWORD })

    expect(res.status).toBe(403)
    expect(res.body.error.message).toMatch(/verify/i)
  })

  it('rejects a malformed request body with a 422', async () => {
    const res = await request(testApp).post('/api/v1/auth/login').send({ email: 'not-an-email', password: '' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('UNPROCESSABLE_ENTITY')
  })
})
