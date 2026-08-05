import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { createActiveUser, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { RefreshToken } from '../../src/models/refreshToken.model'

const COOKIE_NAME = 'keepxtra_refresh_token'

function extractCookieValue(setCookieHeader: string[] | undefined, name: string): string {
  const cookie = setCookieHeader?.find((c) => c.startsWith(`${name}=`))
  if (!cookie) throw new Error(`Cookie "${name}" not found in Set-Cookie header`)
  return cookie.split(';')[0]!.slice(name.length + 1)
}

async function login(email: string) {
  const res = await request(testApp).post('/api/v1/auth/login').send({ email, password: DEFAULT_TEST_PASSWORD })
  const refreshToken = extractCookieValue(res.headers['set-cookie'] as unknown as string[], COOKIE_NAME)
  return { loginRes: res, refreshToken }
}

function withRefreshCookie(token: string) {
  return `${COOKIE_NAME}=${token}`
}

describe('POST /api/v1/auth/refresh', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })
    const { loginRes, refreshToken } = await login('kwame@keepxtra.com')

    const res = await request(testApp).post('/api/v1/auth/refresh').set('Cookie', withRefreshCookie(refreshToken))

    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toEqual(expect.any(String))
    expect(res.body.data.accessToken).not.toBe(loginRes.body.data.accessToken)

    const newRefreshToken = extractCookieValue(res.headers['set-cookie'] as unknown as string[], COOKIE_NAME)
    expect(newRefreshToken).not.toBe(refreshToken)
  })

  it('keeps the same rotation family across a refresh, and marks the old token replaced', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })
    const { refreshToken } = await login('kwame@keepxtra.com')

    const originalDoc = await RefreshToken.findOne({}).exec()
    const originalFamily = originalDoc!.family

    const res = await request(testApp).post('/api/v1/auth/refresh').set('Cookie', withRefreshCookie(refreshToken))
    const newRefreshToken = extractCookieValue(res.headers['set-cookie'] as unknown as string[], COOKIE_NAME)

    const docs = await RefreshToken.find({}).sort({ createdAt: 1 }).exec()
    expect(docs).toHaveLength(2)
    expect(docs[1]!.family).toBe(originalFamily)
    expect(docs[0]!.revokedAt).not.toBeNull()

    const { hashToken } = await import('../../src/utils/crypto')
    expect(docs[0]!.replacedByTokenHash).toBe(hashToken(newRefreshToken))
  })

  it('detects reuse of an already-rotated refresh token and revokes the whole family', async () => {
    const { user } = await createActiveUser({ email: 'kwame@keepxtra.com' })
    const { refreshToken: firstToken } = await login('kwame@keepxtra.com')

    const rotateRes = await request(testApp).post('/api/v1/auth/refresh').set('Cookie', withRefreshCookie(firstToken))
    const secondToken = extractCookieValue(rotateRes.headers['set-cookie'] as unknown as string[], COOKIE_NAME)

    // Replaying the ORIGINAL token (already rotated away) is a reuse signal.
    const replayRes = await request(testApp).post('/api/v1/auth/refresh').set('Cookie', withRefreshCookie(firstToken))
    expect(replayRes.status).toBe(401)

    // The whole family — including the token that was still valid a moment ago — is now dead.
    const followUpRes = await request(testApp).post('/api/v1/auth/refresh').set('Cookie', withRefreshCookie(secondToken))
    expect(followUpRes.status).toBe(401)

    const tokens = await RefreshToken.find({ userId: user._id }).exec()
    expect(tokens.every((t) => t.revokedAt !== null)).toBe(true)
  })

  it('rejects a request with no refresh token', async () => {
    const res = await request(testApp).post('/api/v1/auth/refresh')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects an unknown/garbage refresh token', async () => {
    const res = await request(testApp).post('/api/v1/auth/refresh').set('Cookie', withRefreshCookie('not-a-real-token'))
    expect(res.status).toBe(401)
  })

  it('rejects an expired refresh token', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })
    const { refreshToken } = await login('kwame@keepxtra.com')

    await RefreshToken.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } }).exec()

    const res = await request(testApp).post('/api/v1/auth/refresh').set('Cookie', withRefreshCookie(refreshToken))
    expect(res.status).toBe(401)
  })

  it('rejects a refresh for a no-longer-active account and revokes the family', async () => {
    const { user } = await createActiveUser({ email: 'kwame@keepxtra.com' })
    const { refreshToken } = await login('kwame@keepxtra.com')

    user.status = 'Suspended'
    await user.save()

    const res = await request(testApp).post('/api/v1/auth/refresh').set('Cookie', withRefreshCookie(refreshToken))
    expect(res.status).toBe(401)

    const tokens = await RefreshToken.find({ userId: user._id }).exec()
    expect(tokens.every((t) => t.revokedAt !== null)).toBe(true)
  })
})

describe('POST /api/v1/auth/logout', () => {
  it('revokes the refresh token and clears the cookie', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })
    const { refreshToken } = await login('kwame@keepxtra.com')

    const logoutRes = await request(testApp).post('/api/v1/auth/logout').set('Cookie', withRefreshCookie(refreshToken))
    expect(logoutRes.status).toBe(200)

    const tokens = await RefreshToken.find({}).exec()
    expect(tokens.every((t) => t.revokedAt !== null)).toBe(true)

    const refreshRes = await request(testApp).post('/api/v1/auth/refresh').set('Cookie', withRefreshCookie(refreshToken))
    expect(refreshRes.status).toBe(401)
  })

  it('succeeds even with no refresh cookie present (idempotent)', async () => {
    const res = await request(testApp).post('/api/v1/auth/logout')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
