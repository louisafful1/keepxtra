import { describe, expect, it, vi, afterEach } from 'vitest'
import { driverService } from '../../src/services/driver.service'
import { driverRepository } from '../../src/repositories/driver.repository'
import { createDriverRecord, createFarmerRecord, createVehicleRecord } from '../utils/factories'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'

/** Same category as vehicle.service.defensive.test.ts. */

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
    permissions: ['drivers.manage'],
  }
}

async function opsActor(): Promise<AuthenticatedUser> {
  const { user } = await createFarmerRecord()
  return actorFrom(user)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DriverService defensive branches', () => {
  it('update throws not-found if the record disappears between findById and updateById', async () => {
    const driver = await createDriverRecord()
    vi.spyOn(driverRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(driverService.update(driver._id.toString(), { name: 'X' }, await opsActor(), {})).rejects.toThrow('Driver not found')
  })

  it('updateStatus throws not-found if the record disappears between findById and updateById', async () => {
    const driver = await createDriverRecord()
    vi.spyOn(driverRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(driverService.updateStatus(driver._id.toString(), { status: 'Off Duty' }, await opsActor(), {})).rejects.toThrow('Driver not found')
  })

  it('assignVehicle throws not-found if the record disappears between findById and the final updateById', async () => {
    const driver = await createDriverRecord()
    const vehicle = await createVehicleRecord()
    vi.spyOn(driverRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      driverService.assignVehicle(driver._id.toString(), { vehicleId: vehicle._id.toString() }, await opsActor(), {}),
    ).rejects.toThrow('Driver not found')
  })

  it('logTrip throws not-found if the record disappears between findById and updateById', async () => {
    const driver = await createDriverRecord()
    vi.spyOn(driverRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(driverService.logTrip(driver._id.toString(), {}, await opsActor(), {})).rejects.toThrow('Driver not found')
  })

  it('softDelete throws not-found if the record disappears between findById and softDeleteById', async () => {
    const driver = await createDriverRecord({ status: 'Available' })
    vi.spyOn(driverRepository, 'softDeleteById').mockResolvedValueOnce(null)

    await expect(driverService.softDelete(driver._id.toString(), await opsActor(), {})).rejects.toThrow('Driver not found')
  })

  it('restore throws not-found if the record disappears between findDeletedById and restoreById', async () => {
    const driver = await createDriverRecord()
    await driverRepository.softDeleteById(driver._id.toString())
    vi.spyOn(driverRepository, 'restoreById').mockResolvedValueOnce(null)

    await expect(driverService.restore(driver._id.toString(), await opsActor(), {})).rejects.toThrow('Driver not found')
  })
})
