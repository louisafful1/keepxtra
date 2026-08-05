import { describe, expect, it, vi, afterEach } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { createActiveUser, createTestUser, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { mailService } from '../../src/services/mail.service'
import { EmailVerificationToken } from '../../src/models/emailVerificationToken.model'
import { hashPassword } from '../../src/utils/password'

function extractToken(url: string): string {
  const match = /token=([^&]+)/.exec(url)
  if (!match) throw new Error(`No token found in URL: ${url}`)
  return match[1]!
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/v1/auth/resend-verification', () => {
  it('sends a verification email for an existing, unverified account', async () => {
    const spy = vi.spyOn(mailService, 'sendVerificationEmail').mockResolvedValue()
    await createTestUser({ email: 'kwame@keepxtra.com', passwordHash: await hashPassword(DEFAULT_TEST_PASSWORD), emailVerifiedAt: null })

    const res = await request(testApp).post('/api/v1/auth/resend-verification').send({ email: 'kwame@keepxtra.com' })

    expect(res.status).toBe(200)
    expect(spy).toHaveBeenCalledOnce()
  })

  it('does not send an email for an already-verified account', async () => {
    const spy = vi.spyOn(mailService, 'sendVerificationEmail').mockResolvedValue()
    await createActiveUser({ email: 'kwame@keepxtra.com' })

    const res = await request(testApp).post('/api/v1/auth/resend-verification').send({ email: 'kwame@keepxtra.com' })

    expect(res.status).toBe(200)
    expect(spy).not.toHaveBeenCalled()
  })

  it('responds identically for an unknown email (no user enumeration)', async () => {
    const spy = vi.spyOn(mailService, 'sendVerificationEmail').mockResolvedValue()

    const res = await request(testApp).post('/api/v1/auth/resend-verification').send({ email: 'nobody@keepxtra.com' })

    expect(res.status).toBe(200)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('POST /api/v1/auth/verify-email', () => {
  async function requestVerificationToken(email: string): Promise<string> {
    const spy = vi.spyOn(mailService, 'sendVerificationEmail').mockResolvedValue()
    await request(testApp).post('/api/v1/auth/resend-verification').send({ email })
    const url = spy.mock.calls[0]![1]
    spy.mockRestore()
    return extractToken(url)
  }

  it('verifies the email and unblocks login', async () => {
    await createTestUser({ email: 'kwame@keepxtra.com', passwordHash: await hashPassword(DEFAULT_TEST_PASSWORD), emailVerifiedAt: null })
    const token = await requestVerificationToken('kwame@keepxtra.com')

    const verifyRes = await request(testApp).post('/api/v1/auth/verify-email').send({ token })
    expect(verifyRes.status).toBe(200)

    const loginRes = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: DEFAULT_TEST_PASSWORD })
    expect(loginRes.status).toBe(200)
  })

  it('blocks login until verified', async () => {
    await createTestUser({ email: 'kwame@keepxtra.com', passwordHash: await hashPassword(DEFAULT_TEST_PASSWORD), emailVerifiedAt: null })

    const loginRes = await request(testApp)
      .post('/api/v1/auth/login')
      .send({ email: 'kwame@keepxtra.com', password: DEFAULT_TEST_PASSWORD })
    expect(loginRes.status).toBe(403)
  })

  it('cannot be used twice', async () => {
    await createTestUser({ email: 'kwame@keepxtra.com', passwordHash: await hashPassword(DEFAULT_TEST_PASSWORD), emailVerifiedAt: null })
    const token = await requestVerificationToken('kwame@keepxtra.com')

    await request(testApp).post('/api/v1/auth/verify-email').send({ token })
    const second = await request(testApp).post('/api/v1/auth/verify-email').send({ token })

    expect(second.status).toBe(400)
  })

  it('rejects an unknown/garbage token', async () => {
    const res = await request(testApp).post('/api/v1/auth/verify-email').send({ token: 'garbage' })
    expect(res.status).toBe(400)
  })

  it('rejects an expired token', async () => {
    await createTestUser({ email: 'kwame@keepxtra.com', passwordHash: await hashPassword(DEFAULT_TEST_PASSWORD), emailVerifiedAt: null })
    const token = await requestVerificationToken('kwame@keepxtra.com')

    await EmailVerificationToken.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } }).exec()

    const res = await request(testApp).post('/api/v1/auth/verify-email').send({ token })
    expect(res.status).toBe(400)
  })
})
