import type { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Wraps an async route/middleware handler so a rejected promise is passed
 * to `next(error)` instead of becoming an unhandled rejection. Express 5
 * does this automatically for async handlers, but wrapping explicitly keeps
 * intent obvious at every call site and protects the code against ever
 * running on an Express 4 app in the future.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
