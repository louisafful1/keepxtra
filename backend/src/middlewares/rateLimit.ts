import { rateLimit, type RateLimitRequestHandler } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { redis } from '../config/redis'
import { env, isTest } from '../config/env'

/**
 * The integration suite shares one long-lived `testApp` instance across
 * hundreds of `it()` blocks — real rate limiting would make unrelated test
 * files start failing with 429s once enough requests accumulate against
 * the same in-memory counter. Skipped by default under `NODE_ENV=test`;
 * `tests/integration/rate-limit.test.ts` flips `RATE_LIMIT_TEST_MODE=true`
 * for the one test file that deliberately exercises the real limiting
 * behavior.
 */
function shouldSkip(): boolean {
  return isTest && process.env.RATE_LIMIT_TEST_MODE !== 'true'
}

/**
 * Shares one Redis-backed store across every limiter when Redis is
 * configured — required for the limit to mean anything once the app runs
 * as more than one instance. Falls back to express-rate-limit's built-in
 * in-memory store (per-process only) when Redis is unset, which is fine for
 * local dev and a single-instance deployment.
 */
function buildLimiter(windowMinutes: number, max: number, message: string): RateLimitRequestHandler {
  // Captured as a local so TypeScript narrows it to non-null inside the closure below (it won't across the imported binding directly).
  const redisClient = redis

  return rateLimit({
    windowMs: windowMinutes * 60_000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
    message: { success: false, error: { message, code: 'RATE_LIMITED' } },
    store: redisClient
      ? new RedisStore({
          // `rate-limit-redis` speaks the plain redis command protocol; ioredis's `.call` is the generic escape hatch for that.
          sendCommand: (...args: string[]) => {
            const [command, ...rest] = args as [string, ...string[]]
            return redisClient.call(command, ...rest) as Promise<never>
          },
          prefix: 'rl:',
        })
      : undefined,
  })
}

/** Applied to every `/api/v1/*` request. */
export const globalRateLimiter = buildLimiter(
  env.RATE_LIMIT_WINDOW_MINUTES,
  env.RATE_LIMIT_MAX_REQUESTS,
  'Too many requests — please try again later.',
)

/** A tighter ceiling on `/api/v1/auth/*` alone — login/register/refresh/password-reset are the endpoints worth throttling harder against credential stuffing and enumeration. */
export const authRateLimiter = buildLimiter(
  env.RATE_LIMIT_WINDOW_MINUTES,
  env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  'Too many authentication attempts — please try again later.',
)
