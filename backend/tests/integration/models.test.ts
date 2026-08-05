import { describe, expect, it } from 'vitest'
import { userRepository } from '../../src/repositories/user.repository'
import { roleRepository } from '../../src/repositories/role.repository'
import { permissionRepository } from '../../src/repositories/permission.repository'
import { createTestPermission, createTestRole, createTestUser } from '../utils/factories'

describe('Permission / Role / User foundations', () => {
  it('creates a permission and finds it by key', async () => {
    const permission = await createTestPermission({ key: 'farmers.view' })

    const found = await permissionRepository.findByKey('farmers.view')
    expect(found?._id.toString()).toBe(permission._id.toString())
  })

  it('creates a role referencing permissions', async () => {
    const permission = await createTestPermission({ key: 'inventory.view' })
    await createTestRole({ name: 'Warehouse Staff', permissions: [permission._id] })

    const found = await roleRepository.findByName('Warehouse Staff')
    expect(found?.permissions).toHaveLength(1)
    expect(found?.permissions[0]?.toString()).toBe(permission._id.toString())
  })

  it('creates a user linked to a role and excludes passwordHash by default', async () => {
    const role = await createTestRole({ name: 'Finance', scope: 'operations' })
    const user = await createTestUser({ name: 'Ama Serwaa', email: 'ama@keepxtra.com', roleId: role._id })

    const found = await userRepository.findById(user._id.toString())
    expect(found?.name).toBe('Ama Serwaa')
    expect((found as unknown as { passwordHash?: string })?.passwordHash).toBeUndefined()
  })

  it('hydrates a user with their role and permissions', async () => {
    const permission = await createTestPermission({ key: 'payments.approve' })
    const role = await createTestRole({ name: 'Finance Lead', permissions: [permission._id] })
    const user = await createTestUser({ roleId: role._id })

    const hydrated = await userRepository.findByIdWithRole(user._id.toString())
    const hydratedRole = hydrated?.roleId as unknown as { name: string; permissions: { key: string }[] }

    expect(hydratedRole.name).toBe('Finance Lead')
    expect(hydratedRole.permissions[0]?.key).toBe('payments.approve')
  })

  it('enforces unique emails', async () => {
    await createTestUser({ email: 'duplicate@keepxtra.com' })

    await expect(createTestUser({ email: 'duplicate@keepxtra.com' })).rejects.toThrow()
  })

  it('soft-deletes without a hard delete, and excludes soft-deleted docs from reads', async () => {
    const user = await createTestUser()

    await userRepository.softDeleteById(user._id.toString())
    const found = await userRepository.findById(user._id.toString())

    expect(found).toBeNull()
  })
})
