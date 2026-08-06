import { userRepository } from '../repositories/user.repository'
import { ApiError } from './ApiError'
import type { IRole } from '../models/role.model'
import type { IPermission } from '../models/permission.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'

/**
 * Rebuilds the `AuthenticatedUser` view for a userId, outside of any HTTP
 * request — for event listeners that perform a system-triggered action
 * (e.g. auto-creating a Pickup when a Storage Request is approved) and
 * still need a real actor to attribute the resulting audit log entry to.
 * Mirrors `authenticate` middleware's role/permission hydration exactly.
 */
export async function loadActor(userId: string): Promise<AuthenticatedUser> {
  const user = await userRepository.findByIdWithRole(userId)
  if (!user) throw ApiError.notFound('User not found')

  const role = user.roleId as unknown as IRole
  const permissions = (role.permissions as unknown as IPermission[]).map((permission) => permission.key)

  return {
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
}
