import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { ApiError } from '../utils/ApiError'

/**
 * Coarse gate on the caller's role name (e.g. "Super Admin", "Farmer").
 * Must run after `authenticate`. For fine-grained checks within the admin
 * side, prefer `requirePermission`.
 */
export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized())
    if (!allowedRoles.includes(req.user.roleName)) {
      return next(ApiError.forbidden(`This action requires one of the following roles: ${allowedRoles.join(', ')}`))
    }
    next()
  }
}
