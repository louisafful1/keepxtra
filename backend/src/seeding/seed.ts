import type { Types } from 'mongoose'
import { Permission } from '../models/permission.model'
import { Role } from '../models/role.model'
import { User } from '../models/user.model'
import { PERMISSIONS } from '../constants/permissions'
import { ROLE_DEFINITIONS } from '../constants/roles'
import { hashPassword } from '../utils/password'
import { logger } from '../config/logger'

const seedLogger = logger.child({ module: 'seed' })

/**
 * Upserts every permission in `constants/permissions.ts` into the database,
 * never duplicating an existing one. Returns each key's ObjectId so
 * `seedRoles` can resolve a role's permission list without a second query.
 */
export async function seedPermissions(): Promise<Map<string, Types.ObjectId>> {
  const idsByKey = new Map<string, Types.ObjectId>()

  for (const definition of PERMISSIONS) {
    const doc = await Permission.findOneAndUpdate(
      { key: definition.key },
      { $setOnInsert: { key: definition.key, module: definition.module, description: definition.description } },
      { upsert: true, returnDocument: 'after' },
    ).exec()
    idsByKey.set(definition.key, doc._id)
  }

  seedLogger.info({ count: idsByKey.size }, 'Permissions synced')
  return idsByKey
}

/** Creates (or resyncs the permission set of) every role in `constants/roles.ts`. `'*'` resolves to every known permission. */
export async function seedRoles(permissionIdsByKey: Map<string, Types.ObjectId>): Promise<void> {
  const everyPermissionId = [...permissionIdsByKey.values()]

  for (const definition of ROLE_DEFINITIONS) {
    const permissionIds =
      definition.permissions === '*'
        ? everyPermissionId
        : definition.permissions.map((key) => permissionIdsByKey.get(key)).filter((id): id is Types.ObjectId => id !== undefined)

    const existing = await Role.findOne({ name: definition.name }).exec()
    if (existing) {
      existing.set({ scope: definition.scope, description: definition.description, permissions: permissionIds, isSystem: true })
      await existing.save()
      continue
    }

    await Role.create({
      name: definition.name,
      scope: definition.scope,
      description: definition.description,
      permissions: permissionIds,
      isSystem: true,
    })
  }

  seedLogger.info({ count: ROLE_DEFINITIONS.length }, 'Roles synced')
}

/** Creates the first Super Admin login from SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD — a no-op if either is unset, or if a user with that email already exists. */
export async function seedSuperAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    seedLogger.info('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping super admin creation')
    return
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() }).exec()
  if (existing) {
    seedLogger.info({ email }, 'A user with this email already exists — skipping super admin creation')
    return
  }

  const superAdminRole = await Role.findOne({ name: 'Super Admin' }).exec()
  if (!superAdminRole) throw new Error('Super Admin role not found — seedRoles() must run before seedSuperAdmin()')

  await User.create({
    name: process.env.SEED_ADMIN_NAME ?? 'Super Admin',
    email,
    passwordHash: await hashPassword(password),
    roleId: superAdminRole._id,
    avatarInitials: 'SA',
    phone: process.env.SEED_ADMIN_PHONE ?? '+000 00 000 0000',
    status: 'Active',
    emailVerifiedAt: new Date(),
  })
  seedLogger.info({ email }, 'Super admin account created')
}

/** Runs every seed step in the required order. */
export async function seedDatabase(): Promise<void> {
  const permissionIds = await seedPermissions()
  await seedRoles(permissionIds)
  await seedSuperAdmin()
  seedLogger.info('Seed complete')
}
