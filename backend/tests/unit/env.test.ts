import { describe, expect, it } from 'vitest'
import { envSchema } from '../../src/config/env'

const REAL_SECRET_A = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'
const REAL_SECRET_B = 'f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3'
const REAL_COOKIE_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef'

function baseEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    NODE_ENV: 'development',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/keepxtra',
    JWT_ACCESS_SECRET: REAL_SECRET_A,
    JWT_REFRESH_SECRET: REAL_SECRET_B,
    COOKIE_SECRET: REAL_COOKIE_SECRET,
    ...overrides,
  }
}

describe('envSchema — general validation', () => {
  it('parses a minimal valid development env, applying defaults', () => {
    const result = envSchema.safeParse(baseEnv())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.PORT).toBe(4000)
      expect(result.data.NODE_ENV).toBe('development')
      expect(result.data.CORS_ORIGIN).toEqual(['http://localhost:5173'])
      expect(result.data.MONGODB_MAX_POOL_SIZE).toBe(10)
      expect(result.data.LOGIN_MAX_ATTEMPTS).toBe(5)
      expect(result.data.RATE_LIMIT_MAX_REQUESTS).toBe(300)
    }
  })

  it('rejects a missing MONGODB_URI', () => {
    const { MONGODB_URI: _drop, ...rest } = baseEnv()
    const result = envSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('accepts "staging" as a valid NODE_ENV', () => {
    const result = envSchema.safeParse(
      baseEnv({
        NODE_ENV: 'staging',
        CORS_ORIGIN: 'https://staging.keepxtra.example.com',
      }),
    )
    expect(result.success).toBe(true)
  })

  it('rejects an unknown NODE_ENV value', () => {
    const result = envSchema.safeParse(baseEnv({ NODE_ENV: 'sandbox' }))
    expect(result.success).toBe(false)
  })

  it('splits a comma-separated CORS_ORIGIN into a trimmed array', () => {
    const result = envSchema.safeParse(baseEnv({ CORS_ORIGIN: 'https://a.example.com, https://b.example.com' }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.CORS_ORIGIN).toEqual(['https://a.example.com', 'https://b.example.com'])
  })
})

describe('envSchema — production/staging hardening', () => {
  const validProdOverrides = { NODE_ENV: 'production', CORS_ORIGIN: 'https://app.keepxtra.example.com' }

  it('accepts a fully real-looking production env', () => {
    const result = envSchema.safeParse(baseEnv(validProdOverrides))
    expect(result.success).toBe(true)
  })

  it('does NOT apply hardening checks in development, even with placeholder-looking secrets', () => {
    const result = envSchema.safeParse(baseEnv({ JWT_ACCESS_SECRET: 'replace-with-a-random-64-char-hex-string-000000000000' }))
    expect(result.success).toBe(true)
  })

  it.each([
    ['JWT_ACCESS_SECRET', 'replace-with-a-random-64-char-hex-string-000000000000'],
    ['JWT_REFRESH_SECRET', 'replace-with-a-different-random-64-char-hex-000000000'],
    ['COOKIE_SECRET', 'replace-with-a-random-32-char-hex-string0000000000000000'],
  ])('rejects a placeholder-looking %s in production', (field, placeholderValue) => {
    const result = envSchema.safeParse(baseEnv({ ...validProdOverrides, [field]: placeholderValue }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes(field))).toBe(true)
    }
  })

  it('rejects identical access and refresh secrets in production', () => {
    const result = envSchema.safeParse(baseEnv({ ...validProdOverrides, JWT_REFRESH_SECRET: REAL_SECRET_A }))
    expect(result.success).toBe(false)
  })

  it('rejects a localhost CORS_ORIGIN in production', () => {
    const result = envSchema.safeParse(baseEnv({ NODE_ENV: 'production', CORS_ORIGIN: 'http://localhost:5173' }))
    expect(result.success).toBe(false)
  })

  it('rejects a 127.0.0.1 CORS_ORIGIN in staging', () => {
    const result = envSchema.safeParse(baseEnv({ NODE_ENV: 'staging', CORS_ORIGIN: 'http://127.0.0.1:5173' }))
    expect(result.success).toBe(false)
  })

  it('accepts one real origin among several in production', () => {
    const result = envSchema.safeParse(
      baseEnv({ NODE_ENV: 'production', CORS_ORIGIN: 'https://app.keepxtra.example.com,https://admin.keepxtra.example.com' }),
    )
    expect(result.success).toBe(true)
  })
})
