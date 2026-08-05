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
 */
export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body)
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params
      next()
    } catch (error) {
      next(ApiError.unprocessable('Request validation failed', error))
    }
  }
}
