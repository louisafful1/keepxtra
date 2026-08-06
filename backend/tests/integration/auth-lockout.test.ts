import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { createActiveUser, DEFAULT_TEST_PASSWORD } from '../utils/factories'
import { User } from '../../src/models/user.model'
import { AuditLog } from '../../src/models/auditLog.model'

const LOGIN_MAX_ATTEMPTS = 5

async function attemptLogin(email: string, password: string) {
  return request(testApp).post('/api/v1/auth/login').send({ email, password })
}

describe('POST /api/v1/auth/login — brute-force lockout', () => {
  it('increments failedLoginAttempts on a wrong password without locking before the threshold', async () => {
    const { user } = await createActiveUser({ email: 'lockout1@keepxtra.com' })

    for (let i = 0; i < LOGIN_MAX_ATTEMPTS - 1; i += 1) {
      const res = await attemptLogin('lockout1@keepxtra.com', 'WrongPassword123')
      expect(res.status).toBe(401)
    }

    const stored = await User.findById(user._id).exec()
    expect(stored?.failedLoginAttempts).toBe(LOGIN_MAX_ATTEMPTS - 1)
    expect(stored?.lockedUntil).toBeNull()

    // The account still isn't locked — the correct password works.
    const res = await attemptLogin('lockout1@keepxtra.com', DEFAULT_TEST_PASSWORD)
    expect(res.status).toBe(200)
  })

  it('locks the account after reaching the max attempts and rejects even the correct password while locked', async () => {
    await createActiveUser({ email: 'lockout2@keepxtra.com' })

    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i += 1) {
      await attemptLogin('lockout2@keepxtra.com', 'WrongPassword123')
    }

    const blockedRes = await attemptLogin('lockout2@keepxtra.com', DEFAULT_TEST_PASSWORD)
    expect(blockedRes.status).toBe(403)
    expect(blockedRes.body.error.message).toMatch(/too many failed login attempts/i)
  })

  it('resets failedLoginAttempts to 0 on a successful login', async () => {
    const { user } = await createActiveUser({ email: 'lockout3@keepxtra.com' })

    await attemptLogin('lockout3@keepxtra.com', 'WrongPassword123')
    await attemptLogin('lockout3@keepxtra.com', 'WrongPassword123')

    const midway = await User.findById(user._id).exec()
    expect(midway?.failedLoginAttempts).toBe(2)

    const res = await attemptLogin('lockout3@keepxtra.com', DEFAULT_TEST_PASSWORD)
    expect(res.status).toBe(200)

    const after = await User.findById(user._id).exec()
    expect(after?.failedLoginAttempts).toBe(0)
    expect(after?.lockedUntil).toBeNull()
  })

  it('clears an expired lock automatically on the next login attempt', async () => {
    const { user } = await createActiveUser({ email: 'lockout4@keepxtra.com' })
    // Simulate a lock that has already expired (as if LOGIN_LOCKOUT_MINUTES had already elapsed).
    await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: LOGIN_MAX_ATTEMPTS, lockedUntil: new Date(Date.now() - 1000) } }).exec()

    const res = await attemptLogin('lockout4@keepxtra.com', DEFAULT_TEST_PASSWORD)
    expect(res.status).toBe(200)

    const after = await User.findById(user._id).exec()
    expect(after?.failedLoginAttempts).toBe(0)
    expect(after?.lockedUntil).toBeNull()
  })

  it('writes an audit log entry for a failed login, the lock, and a blocked attempt', async () => {
    const { user } = await createActiveUser({ email: 'lockout5@keepxtra.com' })

    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i += 1) {
      await attemptLogin('lockout5@keepxtra.com', 'WrongPassword123')
    }
    await attemptLogin('lockout5@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const entries = await AuditLog.find({ entityId: user._id }).sort({ createdAt: 1 }).exec()
    const actions = entries.map((e) => e.action)

    expect(actions.filter((a) => a === 'Login Failed — Invalid Password')).toHaveLength(LOGIN_MAX_ATTEMPTS - 1)
    expect(actions).toContain('Account Locked (too many failed logins)')
    expect(actions).toContain('Login Blocked — Account Locked')
  })

  it('does not lock or count attempts against an unknown email', async () => {
    const res = await attemptLogin('does-not-exist@keepxtra.com', 'whatever')
    expect(res.status).toBe(401)
    const count = await AuditLog.countDocuments({ affectedRecord: 'does-not-exist@keepxtra.com' }).exec()
    expect(count).toBe(0)
  })
})
