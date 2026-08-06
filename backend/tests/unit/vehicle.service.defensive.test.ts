import { describe, expect, it, vi, afterEach } from 'vitest'
import { vehicleService } from '../../src/services/vehicle.service'
import { vehicleRepository } from '../../src/repositories/vehicle.repository'
import { createFarmerRecord, createVehicleRecord } from '../utils/factories'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'

/** Same category as warehouse.service.defensive.test.ts and coldRoom.service.defensive.test.ts. */

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
    permissions: ['fleet.manage'],
  }
}

async function opsActor(): Promise<AuthenticatedUser> {
  const { user } = await createFarmerRecord()
  return actorFrom(user)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('VehicleService defensive branches', () => {
  it('update throws not-found if the record disappears between findById and updateById', async () => {
    const vehicle = await createVehicleRecord()
    vi.spyOn(vehicleRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(vehicleService.update(vehicle._id.toString(), { type: 'Van' }, await opsActor(), {})).rejects.toThrow('Vehicle not found')
  })

  it('updateStatus throws not-found if the record disappears between findById and updateById', async () => {
    const vehicle = await createVehicleRecord()
    vi.spyOn(vehicleRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(vehicleService.updateStatus(vehicle._id.toString(), { status: 'Under Maintenance' }, await opsActor(), {})).rejects.toThrow(
      'Vehicle not found',
    )
  })

  it('softDelete throws not-found if the record disappears between findById and softDeleteById', async () => {
    const vehicle = await createVehicleRecord({ status: 'Available' })
    vi.spyOn(vehicleRepository, 'softDeleteById').mockResolvedValueOnce(null)

    await expect(vehicleService.softDelete(vehicle._id.toString(), await opsActor(), {})).rejects.toThrow('Vehicle not found')
  })

  it('restore throws not-found if the record disappears between findDeletedById and restoreById', async () => {
    const vehicle = await createVehicleRecord()
    await vehicleRepository.softDeleteById(vehicle._id.toString())
    vi.spyOn(vehicleRepository, 'restoreById').mockResolvedValueOnce(null)

    await expect(vehicleService.restore(vehicle._id.toString(), await opsActor(), {})).rejects.toThrow('Vehicle not found')
  })
})
