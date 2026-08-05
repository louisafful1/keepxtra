import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { ZodType } from 'zod'
import { ApiError } from '../utils/ApiError'

export interface RequestSchemas {
  body?: ZodType
  query?: ZodType
  params?: ZodType
}

/**
 * Validates `req.body`/`req.query`/`req.params` against the given Zod
 * schemas before a controller ever runs. On success, the parsed (and
 * possibly transformed/defaulted) value replaces the original — this is
 * how numeric/date query params arrive at the controller already coerced.
 *
 * Express 5 exposes `req.query` as a getter-only accessor (it's derived
 * lazily from the raw URL), so a plain `req.query = ...` throws
 * `TypeError: Cannot set property query of #<IncomingMessage> which has
 * only a getter`. `req.body`/`req.params` are still plain writable
 * properties in Express 5 — only `query` needs the `defineProperty`
 * workaround.
 */
export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body)
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query)
        Object.defineProperty(req, 'query', { value: parsedQuery, writable: true, enumerable: true, configurable: true })
      }
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params
      next()
    } catch (error) {
      next(ApiError.unprocessable('Request validation failed', error))
    }
  }
}
