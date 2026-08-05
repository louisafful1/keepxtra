import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { ApiError } from '../utils/ApiError'
import type { PermissionKey } from '../constants/permissions'

/**
 * Fine-grained permission gate, mirroring the frontend's `can(permission)`
 * check (`usePermissions.ts`). Must run after `authenticate`, which
 * populates `req.user.permissions` from the caller's current role.
 */
export function requirePermission(...requiredPermissions: PermissionKey[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized())

    const hasEvery = requiredPermissions.every((permission) => req.user!.permissions.includes(permission))
    if (!hasEvery) {
      return next(ApiError.forbidden(`Missing required permission(s): ${requiredPermissions.join(', ')}`))
    }
    next()
  }
}
