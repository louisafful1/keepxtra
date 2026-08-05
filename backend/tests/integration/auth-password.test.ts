import { describe, expect, it, vi, afterEach } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { createActiveUser, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { mailService } from '../../src/services/mail.service'
import { PasswordResetToken } from '../../src/models/passwordResetToken.model'
import { RefreshToken } from '../../src/models/refreshToken.model'

function extractToken(url: string): string {
  const match = /token=([^&]+)/.exec(url)
  if (!match) throw new Error(`No token found in URL: ${url}`)
  return match[1]!
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/v1/auth/forgot-password', () => {
  it('sends a reset email and creates a token for an existing account', async () => {
    const spy = vi.spyOn(mailService, 'sendPasswordResetEmail').mockResolvedValue()
    const { user } = await createActiveUser({ email: 'kwame@keepxtra.com' })

    const res = await request(testApp).post('/api/v1/auth/forgot-password').send({ email: 'kwame@keepxtra.com' })

    expect(res.status).toBe(200)
    expect(spy).toHaveBeenCalledOnce()
    expect(spy.mock.calls[0]![0]).toBe('kwame@keepxtra.com')

    const tokens = await PasswordResetToken.find({ userId: user._id }).exec()
    expect(tokens).toHaveLength(1)
  })

  it('responds identically for an unknown email and sends no mail (no user enumeration)', async () => {
    const spy = vi.spyOn(mailService, 'sendPasswordResetEmail').mockResolvedValue()

    const res = await request(testApp).post('/api/v1/auth/forgot-password').send({ email: 'nobody@keepxtra.com' })

    expect(res.status).toBe(200)
    expect(spy).not.toHaveBeenCalled()
  })

  it('rejects a malformed email with a 422', async () => {
    const res = await request(testApp).post('/api/v1/auth/forgot-password').send({ email: 'not-an-email' })
    expect(res.status).toBe(422)
  })
})

describe('POST /api/v1/auth/reset-password', () => {
  async function requestResetToken(email: string): Promise<string> {
    const spy = vi.spyOn(mailService, 'sendPasswordResetEmail').mockResolvedValue()
    await request(testApp).post('/api/v1/auth/forgot-password').send({ email })
    const url = spy.mock.calls[0]![1]
    spy.mockRestore()
    return extractToken(url)
  }

  it('resets the password, invalidates the old one, and revokes every session', async () => {
    const { user } = await createActiveUser({ email: 'kwame@keepxtra.com' })
    const loginRes = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: DEFAULT_TEST_PASSWORD })
    const oldAccessToken = loginRes.body.data.accessToken as string

    const token = await requestResetToken('kwame@keepxtra.com')
    const resetRes = await request(testApp).post('/api/v1/auth/reset-password').send({ token, newPassword: 'NewPassword123' })
    expect(resetRes.status).toBe(200)

    // Every session that existed at reset time was revoked.
    const tokens = await RefreshToken.find({ userId: user._id }).exec()
    expect(tokens.every((t) => t.revokedAt !== null)).toBe(true)

    // The access token issued before the reset is now rejected (tokenVersion bumped).
    const meRes = await request(testApp).get('/api/v1/auth/me').set('Authorization', `Bearer ${oldAccessToken}`)
    expect(meRes.status).toBe(401)

    // Old password no longer works.
    const oldLoginRes = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: DEFAULT_TEST_PASSWORD })
    expect(oldLoginRes.status).toBe(401)

    // New password works.
    const newLoginRes = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: 'NewPassword123' })
    expect(newLoginRes.status).toBe(200)
  })

  it('cannot be used twice', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })
    const token = await requestResetToken('kwame@keepxtra.com')

    await request(testApp).post('/api/v1/auth/reset-password').send({ token, newPassword: 'NewPassword123' })
    const secondAttempt = await request(testApp).post('/api/v1/auth/reset-password').send({ token, newPassword: 'AnotherPassword1' })

    expect(secondAttempt.status).toBe(400)
  })

  it('rejects an unknown/garbage token', async () => {
    const res = await request(testApp).post('/api/v1/auth/reset-password').send({ token: 'garbage', newPassword: 'NewPassword123' })
    expect(res.status).toBe(400)
  })

  it('rejects an expired token', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })
    const token = await requestResetToken('kwame@keepxtra.com')

    await PasswordResetToken.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } }).exec()

    const res = await request(testApp).post('/api/v1/auth/reset-password').send({ token, newPassword: 'NewPassword123' })
    expect(res.status).toBe(400)
  })

  it('rejects a weak new password with a 422', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })
    const token = await requestResetToken('kwame@keepxtra.com')

    const res = await request(testApp).post('/api/v1/auth/reset-password').send({ token, newPassword: 'weak' })
    expect(res.status).toBe(422)
  })
})

describe('POST /api/v1/auth/change-password', () => {
  async function loginAndGetToken(email: string) {
    const res = await request(testApp).post('/api/v1/auth/login').send({ email, password: DEFAULT_TEST_PASSWORD })
    return res.body.data.accessToken as string
  }

  it("changes the password and revokes every session, including the current one", async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })
    const accessToken = await loginAndGetToken('kwame@keepxtra.com')

    const res = await request(testApp)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: DEFAULT_TEST_PASSWORD, newPassword: 'NewPassword123' })

    expect(res.status).toBe(200)

    // The very token used to make this call is now invalid.
    const meRes = await request(testApp).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`)
    expect(meRes.status).toBe(401)

    const newLoginRes = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: 'NewPassword123' })
    expect(newLoginRes.status).toBe(200)
  })

  it('rejects an incorrect current password without revoking the session', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })
    const accessToken = await loginAndGetToken('kwame@keepxtra.com')

    const res = await request(testApp)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'WrongPassword1', newPassword: 'NewPassword123' })

    expect(res.status).toBe(401)

    // The session survives an incorrect attempt.
    const meRes = await request(testApp).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`)
    expect(meRes.status).toBe(200)
  })

  it('requires authentication', async () => {
    const res = await request(testApp)
      .post('/api/v1/auth/change-password')
      .send({ currentPassword: DEFAULT_TEST_PASSWORD, newPassword: 'NewPassword123' })
    expect(res.status).toBe(401)
  })

  it('rejects a weak new password with a 422', async () => {
    await createActiveUser({ email: 'kwame@keepxtra.com' })
    const accessToken = await loginAndGetToken('kwame@keepxtra.com')

    const res = await request(testApp)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: DEFAULT_TEST_PASSWORD, newPassword: 'weak' })

    expect(res.status).toBe(422)
  })
})
