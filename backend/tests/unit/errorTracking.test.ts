import { describe, expect, it } from 'vitest'
import { reportError } from '../../src/utils/errorTracking'

describe('reportError', () => {
  it('is a no-op that never throws, regardless of input', () => {
    expect(() => reportError(new Error('boom'))).not.toThrow()
    expect(() => reportError('a string error')).not.toThrow()
    expect(() => reportError(null)).not.toThrow()
    expect(() => reportError(new Error('boom'), { requestId: '123', path: '/x' })).not.toThrow()
  })

  it('returns undefined', () => {
    expect(reportError(new Error('boom'))).toBeUndefined()
  })
})
