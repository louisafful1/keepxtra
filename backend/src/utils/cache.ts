import { redis } from '../config/redis'
import { logger } from '../config/logger'

const cacheLogger = logger.child({ module: 'cache' })

/**
 * Read-through cache built on the shared, optional Redis client. When Redis
 * isn't configured, `getOrSet` is a pure passthrough — it always calls
 * `compute()` — so nothing in the app can depend on Redis being present for
 * correctness, only for speed. A Redis outage mid-request degrades the same
 * way (the `.catch` below falls back to `compute()`), never surfaces as a
 * 500 to the caller.
 */
async function getOrSet<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  if (!redis) return compute()

  try {
    const cached = await redis.get(key)
    if (cached !== null) return JSON.parse(cached) as T
  } catch (err) {
    cacheLogger.warn({ err, key }, 'Cache read failed — falling through to a live computation')
  }

  const value = await compute()

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch (err) {
    cacheLogger.warn({ err, key }, 'Cache write failed — continuing without caching this result')
  }

  return value
}

/** Deletes every key matching a prefix — for invalidating a cached read after the underlying data changes. Cheap no-op when Redis isn't configured. */
async function invalidate(keyPrefix: string): Promise<void> {
  if (!redis) return

  try {
    const keys = await redis.keys(`${keyPrefix}*`)
    if (keys.length > 0) await redis.del(...keys)
  } catch (err) {
    cacheLogger.warn({ err, keyPrefix }, 'Cache invalidation failed')
  }
}

export const cache = { getOrSet, invalidate }
