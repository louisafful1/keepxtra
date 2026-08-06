import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  keys: vi.fn(),
  del: vi.fn(),
}

describe('cache — with Redis configured', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../../src/config/redis', () => ({ redis: mockRedis }))
    for (const fn of Object.values(mockRedis)) fn.mockReset()
  })

  it('returns a cached value on hit without calling compute', async () => {
    mockRedis.get.mockResolvedValueOnce(JSON.stringify({ hello: 'world' }))
    const { cache } = await import('../../src/utils/cache')
    const compute = vi.fn()

    const result = await cache.getOrSet('key', 30, compute)

    expect(result).toEqual({ hello: 'world' })
    expect(compute).not.toHaveBeenCalled()
  })

  it('computes and writes to cache on a miss', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    mockRedis.set.mockResolvedValueOnce('OK')
    const { cache } = await import('../../src/utils/cache')
    const compute = vi.fn().mockResolvedValueOnce({ fresh: true })

    const result = await cache.getOrSet('key', 30, compute)

    expect(result).toEqual({ fresh: true })
    expect(compute).toHaveBeenCalledOnce()
    expect(mockRedis.set).toHaveBeenCalledWith('key', JSON.stringify({ fresh: true }), 'EX', 30)
  })

  it('falls back to compute() when the cache read throws', async () => {
    mockRedis.get.mockRejectedValueOnce(new Error('boom'))
    mockRedis.set.mockResolvedValueOnce('OK')
    const { cache } = await import('../../src/utils/cache')
    const compute = vi.fn().mockResolvedValueOnce('fallback-value')

    const result = await cache.getOrSet('key', 30, compute)

    expect(result).toBe('fallback-value')
  })

  it('still returns the computed value even if the cache write fails', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    mockRedis.set.mockRejectedValueOnce(new Error('boom'))
    const { cache } = await import('../../src/utils/cache')
    const compute = vi.fn().mockResolvedValueOnce('value')

    const result = await cache.getOrSet('key', 30, compute)

    expect(result).toBe('value')
  })

  it('invalidate deletes every key matching the prefix', async () => {
    mockRedis.keys.mockResolvedValueOnce(['prefix:a', 'prefix:b'])
    mockRedis.del.mockResolvedValueOnce(2)
    const { cache } = await import('../../src/utils/cache')

    await cache.invalidate('prefix:')

    expect(mockRedis.keys).toHaveBeenCalledWith('prefix:*')
    expect(mockRedis.del).toHaveBeenCalledWith('prefix:a', 'prefix:b')
  })

  it('invalidate is a no-op when no keys match', async () => {
    mockRedis.keys.mockResolvedValueOnce([])
    const { cache } = await import('../../src/utils/cache')

    await cache.invalidate('prefix:')

    expect(mockRedis.del).not.toHaveBeenCalled()
  })

  it('invalidate swallows a Redis error rather than throwing', async () => {
    mockRedis.keys.mockRejectedValueOnce(new Error('boom'))
    const { cache } = await import('../../src/utils/cache')

    await expect(cache.invalidate('prefix:')).resolves.toBeUndefined()
  })
})

describe('cache — Redis not configured', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../../src/config/redis', () => ({ redis: null }))
  })

  it('getOrSet always calls compute() directly, never touching a cache', async () => {
    const { cache } = await import('../../src/utils/cache')
    const compute = vi.fn().mockResolvedValueOnce('live-value')

    const result = await cache.getOrSet('key', 30, compute)

    expect(result).toBe('live-value')
    expect(compute).toHaveBeenCalledOnce()
  })

  it('invalidate is a no-op', async () => {
    const { cache } = await import('../../src/utils/cache')
    await expect(cache.invalidate('prefix:')).resolves.toBeUndefined()
  })
})
