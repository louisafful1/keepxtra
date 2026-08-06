import Redis from 'ioredis'
import { env } from './env'
import { logger } from './logger'

const redisLogger = logger.child({ module: 'redis' })

/**
 * Redis is optional infrastructure — every feature that wants it (rate-limit
 * store, response caching) must degrade gracefully when `REDIS_URL` is
 * unset, rather than making Redis a hard dependency of the app. This is the
 * single shared client every one of those features reuses; `null` here is a
 * deliberate signal to fall back to an in-memory/no-op implementation.
 */
export const redis: Redis | null = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      // Never let a slow/unreachable Redis pile up work or crash the process — callers already handle the rejection by falling back.
      maxRetriesPerRequest: 2,
      lazyConnect: false,
    })
  : null

if (redis) {
  redis.on('error', (err) => redisLogger.error({ err }, 'Redis connection error'))
  redis.on('connect', () => redisLogger.info('Redis connected'))
}

export async function disconnectRedis(): Promise<void> {
  if (redis) await redis.quit()
}
