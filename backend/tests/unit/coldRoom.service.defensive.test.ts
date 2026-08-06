import { describe, expect, it, vi, afterEach } from 'vitest'
import { coldRoomService } from '../../src/services/coldRoom.service'
import { coldRoomRepository } from '../../src/repositories/coldRoom.repository'
import { createColdRoomRecord, createFarmerRecord } from '../utils/factories'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'

/** Same category as warehouse.service.defensive.test.ts — races that don't occur in real HTTP traffic. */

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
  const { user } = await createFarmerRecord()
  return actorFrom(user)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ColdRoomService defensive branches', () => {
  it('update throws not-found if the record disappears between findById and updateById', async () => {
    const { coldRoom } = await createColdRoomRecord()
    vi.spyOn(coldRoomRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(coldRoomService.update(coldRoom._id.toString(), { name: 'X' }, await opsActor(), {})).rejects.toThrow('Cold room not found')
  })

  it('updateStatus throws not-found if the record disappears between findById and updateById', async () => {
    const { coldRoom } = await createColdRoomRecord()
    vi.spyOn(coldRoomRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(coldRoomService.updateStatus(coldRoom._id.toString(), { status: 'Inactive' }, await opsActor(), {})).rejects.toThrow(
      'Cold room not found',
    )
  })

  it('recordReading throws not-found if the record disappears between findById and updateById', async () => {
    const { coldRoom } = await createColdRoomRecord()
    vi.spyOn(coldRoomRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(coldRoomService.recordReading(coldRoom._id.toString(), { temperatureC: 2 }, await opsActor(), {})).rejects.toThrow(
      'Cold room not found',
    )
  })

  it('adjustOccupancy throws not-found if the record disappears between findById and updateById', async () => {
    const { coldRoom } = await createColdRoomRecord({ capacityKg: 8000 })
    vi.spyOn(coldRoomRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(coldRoomService.adjustOccupancy(coldRoom._id.toString(), { occupancyKg: 100 }, await opsActor(), {})).rejects.toThrow(
      'Cold room not found',
    )
  })

  it('softDelete throws not-found if the record disappears between findById and softDeleteById', async () => {
    const { coldRoom } = await createColdRoomRecord({ currentOccupancyKg: 0 })
    vi.spyOn(coldRoomRepository, 'softDeleteById').mockResolvedValueOnce(null)

    await expect(coldRoomService.softDelete(coldRoom._id.toString(), await opsActor(), {})).rejects.toThrow('Cold room not found')
  })

  it('restore throws not-found if the record disappears between findDeletedById and restoreById', async () => {
    const { coldRoom } = await createColdRoomRecord()
    await coldRoomRepository.softDeleteById(coldRoom._id.toString())
    vi.spyOn(coldRoomRepository, 'restoreById').mockResolvedValueOnce(null)

    await expect(coldRoomService.restore(coldRoom._id.toString(), await opsActor(), {})).rejects.toThrow('Cold room not found')
  })
})
