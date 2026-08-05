import { Role, type IRole } from '../../src/models/role.model'
import { Permission, type IPermission } from '../../src/models/permission.model'
import { User, type IUser } from '../../src/models/user.model'
import { Farmer, type IFarmer } from '../../src/models/farmer.model'
import { hashPassword } from '../../src/utils/password'

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

/** The plaintext password every `createActiveUser()` account is set up with, unless overridden. */
export const DEFAULT_TEST_PASSWORD = 'Password123'

/**
 * A ready-to-log-in account: Active, email verified, real bcrypt hash for
 * `DEFAULT_TEST_PASSWORD` (or `overrides.password` if given), with a role
 * carrying the given permission keys. This is what every auth integration
 * test should build on rather than poking at `createTestUser` directly.
 */
export async function createActiveUser(
  overrides: Partial<IUser> & { roleId?: IUser['roleId']; password?: string; permissionKeys?: string[] } = {},
): Promise<{ user: IUser; password: string }> {
  const password = overrides.password ?? DEFAULT_TEST_PASSWORD
  const passwordHash = await hashPassword(password)

  let roleId = overrides.roleId
  if (!roleId) {
    const permissionDocs = await Promise.all((overrides.permissionKeys ?? []).map((key) => createTestPermission({ key })))
    roleId = (await createTestRole({ permissions: permissionDocs.map((p) => p._id) }))._id
  }

  // `?? new Date()` would incorrectly override an explicit `emailVerifiedAt: null`
  // (used by tests to build an unverified account) — only default when the
  // key was omitted entirely.
  const emailVerifiedAt = 'emailVerifiedAt' in overrides ? overrides.emailVerifiedAt : new Date()

  const user = await createTestUser({
    ...overrides,
    roleId,
    passwordHash,
    status: overrides.status ?? 'Active',
    emailVerifiedAt,
  })

  return { user, password }
}

/**
 * Creates a Farmer document directly (bypassing `FarmerService.register`,
 * so no email is sent and no linked User is auto-created unless one isn't
 * supplied) — for tests that need an existing farmer to read/update/
 * delete/restore/search rather than exercising registration itself.
 */
export async function createFarmerRecord(
  overrides: Partial<IFarmer> & { userId?: IFarmer['userId'] } = {},
): Promise<{ farmer: IFarmer; user: IUser }> {
  let userId = overrides.userId
  let user: IUser

  if (userId) {
    const existing = await User.findById(userId).exec()
    if (!existing) throw new Error('createFarmerRecord: overrides.userId does not reference an existing user')
    user = existing
  } else {
    const role = await createTestRole({ name: unique('Farmer Role'), scope: 'farmer', permissions: [] })
    ;({ user } = await createActiveUser({ roleId: role._id }))
    userId = user._id
  }

  const farmer = await Farmer.create({
    userId,
    farmerNumber: overrides.farmerNumber ?? unique('FRM'),
    firstName: overrides.firstName ?? 'Ama',
    lastName: overrides.lastName ?? 'Owusu',
    phone: overrides.phone ?? `+233 20 ${String(counter).padStart(3, '0')} 0000`,
    alternativePhone: overrides.alternativePhone ?? null,
    email: overrides.email ?? user.email,
    nationalId: overrides.nationalId ?? null,
    farmName: overrides.farmName ?? 'Owusu Farms',
    farmLocation: overrides.farmLocation ?? 'Techiman Farm Gate',
    district: overrides.district ?? 'Techiman North',
    region: overrides.region ?? 'Bono East',
    gpsCoordinates: overrides.gpsCoordinates ?? null,
    primaryCrops: overrides.primaryCrops ?? ['Maize'],
    preferredPickupDays: overrides.preferredPickupDays ?? [],
    preferredPaymentMethod: overrides.preferredPaymentMethod ?? 'Mobile Money',
    bankDetails: overrides.bankDetails ?? null,
    mobileMoneyDetails: overrides.mobileMoneyDetails ?? { provider: 'MTN', phoneNumber: '+233 20 000 0000' },
    status: overrides.status ?? 'Active',
    notes: overrides.notes ?? null,
  })

  return { farmer, user }
}
