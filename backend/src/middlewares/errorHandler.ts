import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import mongoose from 'mongoose'
import { ApiError } from '../utils/ApiError'
import { logger } from '../config/logger'
import { isProduction } from '../config/env'
import { reportError } from '../utils/errorTracking'

interface NormalizedError {
  statusCode: number
  code: string
  message: string
  details?: unknown
}

function normalize(error: unknown): NormalizedError {
  if (error instanceof ApiError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message, details: error.details }
  }

  if (error instanceof ZodError) {
    return { statusCode: 422, code: 'UNPROCESSABLE_ENTITY', message: 'Validation failed', details: error.flatten() }
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return { statusCode: 422, code: 'UNPROCESSABLE_ENTITY', message: error.message, details: error.errors }
  }

  if (error instanceof mongoose.Error.CastError) {
    return { statusCode: 400, code: 'BAD_REQUEST', message: `Invalid value for field "${error.path}"` }
  }

  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    return { statusCode: 409, code: 'CONFLICT', message: 'A record with this value already exists' }
  }

  return { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong' }
}

/**
 * The single choke point every error in the app funnels through — thrown
 * from a controller, forwarded via `next(error)`, or bubbled up by
 * `asyncHandler`. Operational errors (ApiError) are returned to the client
 * with their real message; anything unexpected is logged in full and
 * returned generically so no internal detail leaks.
 */
// Express identifies error-handling middleware by its arity (4 params) — `_next` must stay even though unused.
export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  const normalized = normalize(error)
  const isOperational = error instanceof ApiError

  const log = req.log ?? logger
  const logPayload = { err: error, requestId: req.id, statusCode: normalized.statusCode }

  if (isOperational) {
    log.warn(logPayload, normalized.message)
  } else {
    log.error(logPayload, 'Unhandled error')
    reportError(error, { requestId: req.id, method: req.method, path: req.path })
  }

  res.status(normalized.statusCode).json({
    success: false,
    error: {
      message: normalized.message,
      code: normalized.code,
      ...(normalized.details ? { details: normalized.details } : {}),
      ...(req.id ? { requestId: req.id } : {}),
    },
    ...((!isProduction && !isOperational) ? { stack: error instanceof Error ? error.stack : undefined } : {}),
  })
}
