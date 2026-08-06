import { afterEach, describe, expect, it } from 'vitest'
import { seedPermissions, seedRoles, seedSuperAdmin, seedDatabase } from '../../src/seeding/seed'
import { Permission } from '../../src/models/permission.model'
import { Role } from '../../src/models/role.model'
import { User } from '../../src/models/user.model'
import { PERMISSIONS } from '../../src/constants/permissions'
import { ROLE_DEFINITIONS } from '../../src/constants/roles'

afterEach(() => {
  delete process.env.SEED_ADMIN_EMAIL
  delete process.env.SEED_ADMIN_PASSWORD
})

describe('seedPermissions', () => {
  it('creates every permission from the catalogue', async () => {
    const idsByKey = await seedPermissions()
    expect(idsByKey.size).toBe(PERMISSIONS.length)
    expect(await Permission.countDocuments().exec()).toBe(PERMISSIONS.length)
  })

  it('is idempotent — running twice does not duplicate', async () => {
    await seedPermissions()
    await seedPermissions()
    expect(await Permission.countDocuments().exec()).toBe(PERMISSIONS.length)
  })
})

describe('seedRoles', () => {
  it('creates every role, resolving "*" to every known permission', async () => {
    const idsByKey = await seedPermissions()
    await seedRoles(idsByKey)

    expect(await Role.countDocuments().exec()).toBe(ROLE_DEFINITIONS.length)

    const superAdmin = await Role.findOne({ name: 'Super Admin' }).exec()
    expect(superAdmin?.permissions).toHaveLength(PERMISSIONS.length)
  })

  it("resyncs an existing role's permissions on a second run rather than duplicating it", async () => {
    const idsByKey = await seedPermissions()
    await seedRoles(idsByKey)
    await seedRoles(idsByKey)
    expect(await Role.countDocuments().exec()).toBe(ROLE_DEFINITIONS.length)
  })
})

describe('seedSuperAdmin', () => {
  it('is a no-op when SEED_ADMIN_EMAIL/PASSWORD are unset', async () => {
    await seedSuperAdmin()
    expect(await User.countDocuments().exec()).toBe(0)
  })

  it('creates the super admin user once the Super Admin role exists', async () => {
    const idsByKey = await seedPermissions()
    await seedRoles(idsByKey)
    process.env.SEED_ADMIN_EMAIL = 'admin@keepxtra.test'
    process.env.SEED_ADMIN_PASSWORD = 'SuperSecret123'

    await seedSuperAdmin()

    const user = await User.findOne({ email: 'admin@keepxtra.test' }).exec()
    expect(user).toBeTruthy()
    expect(user?.status).toBe('Active')
    expect(user?.emailVerifiedAt).toBeTruthy()
  })

  it('throws if the Super Admin role does not exist yet', async () => {
    process.env.SEED_ADMIN_EMAIL = 'admin2@keepxtra.test'
    process.env.SEED_ADMIN_PASSWORD = 'SuperSecret123'
    await expect(seedSuperAdmin()).rejects.toThrow('Super Admin role not found')
  })

  it('skips creating a duplicate if a user with that email already exists', async () => {
    const idsByKey = await seedPermissions()
    await seedRoles(idsByKey)
    process.env.SEED_ADMIN_EMAIL = 'admin3@keepxtra.test'
    process.env.SEED_ADMIN_PASSWORD = 'SuperSecret123'

    await seedSuperAdmin()
    await seedSuperAdmin()

    expect(await User.countDocuments({ email: 'admin3@keepxtra.test' }).exec()).toBe(1)
  })
})

describe('seedDatabase', () => {
  it('runs every step end to end', async () => {
    process.env.SEED_ADMIN_EMAIL = 'admin4@keepxtra.test'
    process.env.SEED_ADMIN_PASSWORD = 'SuperSecret123'

    await seedDatabase()

    expect(await Permission.countDocuments().exec()).toBe(PERMISSIONS.length)
    expect(await Role.countDocuments().exec()).toBe(ROLE_DEFINITIONS.length)
    expect(await User.countDocuments({ email: 'admin4@keepxtra.test' }).exec()).toBe(1)
  })
})
