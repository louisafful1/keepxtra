import { describe, expect, it } from 'vitest'
import { ApiError } from '../../src/utils/ApiError'

describe('ApiError', () => {
  it('carries the right status code and code for each factory', () => {
    expect(ApiError.badRequest()).toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' })
    expect(ApiError.unauthorized()).toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' })
    expect(ApiError.forbidden()).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' })
    expect(ApiError.notFound()).toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    expect(ApiError.conflict()).toMatchObject({ statusCode: 409, code: 'CONFLICT' })
    expect(ApiError.unprocessable()).toMatchObject({ statusCode: 422, code: 'UNPROCESSABLE_ENTITY' })
    expect(ApiError.tooManyRequests()).toMatchObject({ statusCode: 429, code: 'TOO_MANY_REQUESTS' })
    expect(ApiError.internal()).toMatchObject({ statusCode: 500, code: 'INTERNAL_ERROR' })
  })

  it('is an instance of Error and preserves a custom message', () => {
    const error = ApiError.notFound('Farmer not found')
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Farmer not found')
    expect(error.isOperational).toBe(true)
  })

  it('carries optional details through to the caller', () => {
    const error = ApiError.unprocessable('Invalid input', { field: 'email' })
    expect(error.details).toEqual({ field: 'email' })
  })
})
