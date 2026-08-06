import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'

/**
 * The one test file that deliberately re-enables real rate-limit
 * enforcement (see `RATE_LIMIT_TEST_MODE` in `src/middlewares/rateLimit.ts`)
 * — every other integration test relies on it being skipped so hundreds of
 * `it()` blocks sharing one `testApp` don't trip a shared in-memory counter.
 */
describe('Auth rate limiting', () => {
  beforeAll(() => {
    process.env.RATE_LIMIT_TEST_MODE = 'true'
  })

  afterAll(() => {
    delete process.env.RATE_LIMIT_TEST_MODE
  })

  it('returns 429 once the auth-specific request ceiling is exceeded', async () => {
    // AUTH_RATE_LIMIT_MAX_REQUESTS default (see .env.example) — a path with
    // no registered route still passes through the router-level limiter
    // before falling through to the global 404 handler, so this exercises
    // the limiter without touching any real auth logic (no bcrypt cost).
    const maxRequests = 20

    let lastStatus = 0
    for (let i = 0; i < maxRequests; i += 1) {
      const res = await request(testApp).get('/api/v1/auth/does-not-exist')
      lastStatus = res.status
    }
    expect(lastStatus).toBe(404)

    const res = await request(testApp).get('/api/v1/auth/does-not-exist')
    expect(res.status).toBe(429)
    expect(res.body).toMatchObject({ success: false, error: { code: 'RATE_LIMITED' } })
  })

  it('sets standard rate-limit headers', async () => {
    const res = await request(testApp).get('/api/v1/auth/does-not-exist')
    expect(res.headers['ratelimit-limit']).toBeDefined()
    expect(res.headers['ratelimit-remaining']).toBeDefined()
  })
})
