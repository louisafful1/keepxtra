/**
 * The one error type every layer of the app is allowed to throw
 * intentionally. The global error handler knows how to translate this into
 * a consistent `{ error: { message, code, details? } }` response — anything
 * that isn't an ApiError is treated as an unexpected bug (logged in full,
 * returned to the client as a generic 500 with no internal detail leaked).
 */
export class ApiError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown
  /** True for expected, handled failures (bad input, not found, etc.) as opposed to programmer errors. */
  readonly isOperational: boolean

  constructor(statusCode: number, message: string, code = 'ERROR', details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new ApiError(400, message, 'BAD_REQUEST', details)
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message, 'UNAUTHORIZED')
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message, 'FORBIDDEN')
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND')
  }

  static conflict(message = 'Resource already exists', details?: unknown) {
    return new ApiError(409, message, 'CONFLICT', details)
  }

  static unprocessable(message = 'Validation failed', details?: unknown) {
    return new ApiError(422, message, 'UNPROCESSABLE_ENTITY', details)
  }

  static tooManyRequests(message = 'Too many requests — please try again later') {
    return new ApiError(429, message, 'TOO_MANY_REQUESTS')
  }

  static internal(message = 'Something went wrong') {
    return new ApiError(500, message, 'INTERNAL_ERROR')
  }
}
