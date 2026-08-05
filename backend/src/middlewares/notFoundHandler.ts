import type { Request, Response } from 'express'
import { ApiError } from '../utils/ApiError'

/** Mounted last, after every route — anything that reaches here matched no route. */
export function notFoundHandler(req: Request, res: Response): void {
  const error = ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`)
  res.status(error.statusCode).json({
    success: false,
    error: { message: error.message, code: error.code, requestId: req.id },
  })
}
