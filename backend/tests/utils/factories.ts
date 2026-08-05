import { Role, type IRole } from '../../src/models/role.model'
import { Permission, type IPermission } from '../../src/models/permission.model'
import { User, type IUser } from '../../src/models/user.model'

/**
 * Minimal test data builders for the foundation models. Every field has a
 * sensible default so a test only has to override what it actually cares
 * about — e.g. `createTestRole({ permissions: [perm._id] })`.
 */

let counter = 0
function unique(prefix: string) {
  counter += 1
  return `${prefix}-${counter}`
}

export async function createTestPermission(overrides: Partial<IPermission> = {}): Promise<IPermission> {
  return Permission.create({
    key: overrides.key ?? unique('test.permission'),
    module: overrides.module ?? 'Test',
    description: overrides.description ?? 'A test permission',
    ...overrides,
  })
}

export async function createTestRole(overrides: Partial<IRole> = {}): Promise<IRole> {
  return Role.create({
    name: overrides.name ?? unique('Test Role'),
    scope: overrides.scope ?? 'operations',
    description: overrides.description ?? 'A test role',
    permissions: overrides.permissions ?? [],
    isSystem: overrides.isSystem ?? false,
    ...overrides,
  })
}

export async function createTestUser(overrides: Partial<IUser> & { roleId?: IUser['roleId'] } = {}): Promise<IUser> {
  const roleId = overrides.roleId ?? (await createTestRole())._id

  return User.create({
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `${unique('test-user')}@example.com`,
    passwordHash: overrides.passwordHash ?? 'not-a-real-hash',
    roleId,
    avatarInitials: overrides.avatarInitials ?? 'TU',
    phone: overrides.phone ?? '+233 24 000 0000',
    status: overrides.status ?? 'Active',
    ...overrides,
  })
}
