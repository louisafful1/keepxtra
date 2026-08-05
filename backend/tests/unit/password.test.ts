import { describe, expect, it } from 'vitest'
import { comparePassword, hashPassword } from '../../src/utils/password'

describe('hashPassword / comparePassword', () => {
  it('produces a hash that is not the plaintext password', async () => {
    const hash = await hashPassword('Password123')
    expect(hash).not.toBe('Password123')
    expect(hash.length).toBeGreaterThan(20)
  })

  it('verifies a matching password', async () => {
    const hash = await hashPassword('Password123')
    await expect(comparePassword('Password123', hash)).resolves.toBe(true)
  })

  it('rejects a non-matching password', async () => {
    const hash = await hashPassword('Password123')
    await expect(comparePassword('WrongPassword', hash)).resolves.toBe(false)
  })

  it('produces a different hash for the same input on every call (random salt)', async () => {
    const [a, b] = await Promise.all([hashPassword('Password123'), hashPassword('Password123')])
    expect(a).not.toBe(b)
  })
})
