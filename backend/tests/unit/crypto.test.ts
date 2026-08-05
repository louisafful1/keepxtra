import { describe, expect, it } from 'vitest'
import { generateOpaqueToken, hashToken } from '../../src/utils/crypto'

describe('generateOpaqueToken', () => {
  it('generates a long, high-entropy hex string', () => {
    const token = generateOpaqueToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('never repeats', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateOpaqueToken()))
    expect(tokens.size).toBe(50)
  })
})

describe('hashToken', () => {
  it('is deterministic for the same input', () => {
    const token = generateOpaqueToken()
    expect(hashToken(token)).toBe(hashToken(token))
  })

  it('never returns the raw token', () => {
    const token = generateOpaqueToken()
    expect(hashToken(token)).not.toBe(token)
  })

  it('produces different hashes for different tokens', () => {
    expect(hashToken(generateOpaqueToken())).not.toBe(hashToken(generateOpaqueToken()))
  })
})
