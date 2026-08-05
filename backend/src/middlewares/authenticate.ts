import type { Request, Response, NextFunction } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiError } from '../utils/ApiError'
import { verifyAccessToken } from '../utils/jwt'
import { userRepository } from '../repositories/user.repository'
import type { IRole } from '../models/role.model'
import type { IPermission } from '../models/permission.model'
import { authLogger } from '../config/logger'

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim() || null
}

/**
 * Verifies the access token and hydrates `req.user` with the caller's
 * current role + permissions (fetched fresh from the database rather than
 * trusted from the token, so a permission change takes effect on the very
 * next request instead of waiting for token refresh).
 */
export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearerToken(req)
  if (!token) throw ApiError.unauthorized('No access token provided')

  let userId: string
  let tokenVersion: number
  try {
    const payload = verifyAccessToken(token)
    userId = payload.sub
    tokenVersion = payload.tokenVersion
  } catch (error) {
    authLogger.warn({ err: error }, 'Access token verification failed')
    throw ApiError.unauthorized('Invalid or expired access token')
  }

  const user = await userRepository.findByIdWithRole(userId)
  if (!user) throw ApiError.unauthorized('User no longer exists')
  if (user.status !== 'Active') throw ApiError.forbidden('Account is not active')

  // A password change/reset bumps `tokenVersion` — any token signed before
  // that bump (even if not yet expired) is a stale credential and must be
  // rejected. This is what makes "log out everywhere" actually instant.
  if (tokenVersion !== user.tokenVersion) {
    throw ApiError.unauthorized('Session is no longer valid — please log in again')
  }

  const role = user.roleId as unknown as IRole
  const permissions = (role.permissions as unknown as IPermission[]).map((permission) => permission.key)

  req.user = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarInitials: user.avatarInitials,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    roleId: role._id.toString(),
    roleName: role.name,
    permissions,
  }

  next()
})
