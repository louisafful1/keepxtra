import { describe, expect, it, vi, afterEach } from 'vitest'
import { warehouseService } from '../../src/services/warehouse.service'
import { warehouseRepository } from '../../src/repositories/warehouse.repository'
import { createFarmerRecord, createWarehouseRecord } from '../utils/factories'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'

/**
 * Same category as pickup.service.defensive.test.ts and
 * storageRequest.service.defensive.test.ts: branches that are effectively
 * unreachable through the real HTTP flow (a `findById` that finds a
 * record, immediately followed by an `updateById`/`softDeleteById`/
 * `restoreById` that, in normal operation, can never fail to find the same
 * record moments later).
 */

function actorFrom(user: IUser): AuthenticatedUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarInitials: user.avatarInitials,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    roleId: user.roleId.toString(),
    roleName: 'Operations',
    permissions: ['warehouses.manage'],
  }
}

async function opsActor(): Promise<AuthenticatedUser> {
  const { user } = await createFarmerRecord() // any User works — only id matters here
  return actorFrom(user)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('WarehouseService defensive branches', () => {
  it('update throws not-found if the record disappears between findById and updateById', async () => {
    const warehouse = await createWarehouseRecord()
    vi.spyOn(warehouseRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(warehouseService.update(warehouse._id.toString(), { name: 'X' }, await opsActor(), {})).rejects.toThrow('Warehouse not found')
  })

  it('updateStatus throws not-found if the record disappears between findById and updateById', async () => {
    const warehouse = await createWarehouseRecord()
    vi.spyOn(warehouseRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(warehouseService.updateStatus(warehouse._id.toString(), { status: 'Inactive' }, await opsActor(), {})).rejects.toThrow(
      'Warehouse not found',
    )
  })

  it('adjustOccupancy throws not-found if the record disappears between findById and updateById (zone-less path)', async () => {
    const warehouse = await createWarehouseRecord({ zones: [] })
    vi.spyOn(warehouseRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(warehouseService.adjustOccupancy(warehouse._id.toString(), { occupancyKg: 100 }, await opsActor(), {})).rejects.toThrow(
      'Warehouse not found',
    )
  })

  it('softDelete throws not-found if the record disappears between findById and softDeleteById', async () => {
    const warehouse = await createWarehouseRecord({ currentOccupancyKg: 0 })
    vi.spyOn(warehouseRepository, 'softDeleteById').mockResolvedValueOnce(null)

    await expect(warehouseService.softDelete(warehouse._id.toString(), await opsActor(), {})).rejects.toThrow('Warehouse not found')
  })

  it('restore throws not-found if the record disappears between findDeletedById and restoreById', async () => {
    const warehouse = await createWarehouseRecord()
    await warehouseRepository.softDeleteById(warehouse._id.toString())
    vi.spyOn(warehouseRepository, 'restoreById').mockResolvedValueOnce(null)

    await expect(warehouseService.restore(warehouse._id.toString(), await opsActor(), {})).rejects.toThrow('Warehouse not found')
  })
})
