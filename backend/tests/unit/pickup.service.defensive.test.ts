import { describe, expect, it, vi, afterEach } from 'vitest'
import { pickupService } from '../../src/services/pickup.service'
import { pickupRepository } from '../../src/repositories/pickup.repository'
import { farmerRepository } from '../../src/repositories/farmer.repository'
import { createFarmerRecord, createPickupRecord, createStorageRequestRecord } from '../utils/factories'
import { Pickup } from '../../src/models/pickup.model'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'
import type { StorageRequestApprovedEvent } from '../../src/events/storageRequest.events'

/**
 * Same category as storageRequest.service.defensive.test.ts: branches that
 * are effectively unreachable through the real HTTP flow (a `findById`
 * that finds a record immediately followed by an `updateById` that, in
 * normal operation, can never fail to find the same record moments later),
 * plus the auto-create listener's idempotency guard against a duplicate
 * `STORAGE_REQUEST_EVENTS.APPROVED` delivery.
 */

function actorFrom(user: IUser, roleName: string, permissions: string[] = []): AuthenticatedUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarInitials: user.avatarInitials,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    roleId: user.roleId.toString(),
    roleName,
    permissions,
  }
}

async function opsActor(permissions: string[]): Promise<AuthenticatedUser> {
  const { user } = await createFarmerRecord()
  return actorFrom(user, 'Operations', permissions)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PickupService.createFromApprovedStorageRequest', () => {
  it('is idempotent — a duplicate event returns the already-created pickup instead of erroring', async () => {
    const { user } = await createFarmerRecord()
    const { request: sr } = await createStorageRequestRecord({ status: 'Approved' })
    const event: StorageRequestApprovedEvent = {
      storageRequestId: sr._id.toString(),
      requestNumber: sr.requestNumber,
      farmerId: sr.farmerId.toString(),
      farmerUserId: user._id.toString(),
      approvedBy: user._id.toString(),
      approvedAt: new Date(),
    }

    const first = await pickupService.createFromApprovedStorageRequest(event)
    const second = await pickupService.createFromApprovedStorageRequest(event)

    expect(second.id).toBe(first.id)
    const count = await Pickup.countDocuments({ storageRequestId: sr._id }).exec()
    expect(count).toBe(1)
  })

  it('throws not-found if the storage request no longer exists', async () => {
    const { user } = await createFarmerRecord()
    const event: StorageRequestApprovedEvent = {
      storageRequestId: '665f1a2b3c4d5e6f7a8b9c0d',
      requestNumber: 'SR-99999',
      farmerId: '665f1a2b3c4d5e6f7a8b9c0e',
      farmerUserId: user._id.toString(),
      approvedBy: user._id.toString(),
      approvedAt: new Date(),
    }

    await expect(pickupService.createFromApprovedStorageRequest(event)).rejects.toThrow('Storage request not found')
  })
})

describe('PickupService defensive branches', () => {
  it('schedule throws not-found if the record disappears between findById and updateById', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    vi.spyOn(pickupRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      pickupService.schedule(
        pickup._id.toString(),
        { scheduledDate: new Date(), scheduledTime: '09:00', driverName: 'D', driverPhone: 'P', vehiclePlateNumber: 'V', vehicleType: 'T' },
        await opsActor(['pickups.manage']),
        {},
      ),
    ).rejects.toThrow('Pickup not found')
  })

  it('schedule falls back to an empty farmerUserId if the farmer record is missing when the event is built', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    vi.spyOn(farmerRepository, 'findById').mockResolvedValueOnce(null)

    const updated = await pickupService.schedule(
      pickup._id.toString(),
      { scheduledDate: new Date(), scheduledTime: '09:00', driverName: 'D', driverPhone: 'P', vehiclePlateNumber: 'V', vehicleType: 'T' },
      await opsActor(['pickups.manage']),
      {},
    )
    expect(updated.status).toBe('Scheduled')
  })

  it('start throws not-found if the record disappears between findById and updateById', async () => {
    const { pickup } = await createPickupRecord({ status: 'Scheduled' })
    vi.spyOn(pickupRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(pickupService.start(pickup._id.toString(), await opsActor(['pickups.manage']), {})).rejects.toThrow('Pickup not found')
  })

  it('arrive throws not-found if the record disappears between findById and updateById', async () => {
    const { pickup } = await createPickupRecord({ status: 'En Route' })
    vi.spyOn(pickupRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(pickupService.arrive(pickup._id.toString(), await opsActor(['pickups.manage']), {})).rejects.toThrow('Pickup not found')
  })

  it('collect throws not-found if the record disappears between findById and updateById', async () => {
    const { pickup } = await createPickupRecord({ status: 'Arrived' })
    vi.spyOn(pickupRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      pickupService.collect(pickup._id.toString(), { collectedQuantity: 1, collectedWeightKg: 1, collectionPhotos: [] }, await opsActor(['pickups.manage']), {}),
    ).rejects.toThrow('Pickup not found')
  })

  it('collect falls back to an empty farmerUserId if the farmer record is missing when the event is built', async () => {
    const { pickup } = await createPickupRecord({ status: 'Arrived' })
    vi.spyOn(farmerRepository, 'findById').mockResolvedValueOnce(null)

    const updated = await pickupService.collect(
      pickup._id.toString(),
      { collectedQuantity: 1, collectedWeightKg: 1, collectionPhotos: [] },
      await opsActor(['pickups.manage']),
      {},
    )
    expect(updated.status).toBe('Collected')
  })

  it('complete throws not-found if the record disappears between findById and updateById', async () => {
    const { pickup } = await createPickupRecord({ status: 'Collected' })
    vi.spyOn(pickupRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(pickupService.complete(pickup._id.toString(), await opsActor(['pickups.manage']), {})).rejects.toThrow('Pickup not found')
  })

  it('complete falls back to an empty farmerUserId if the farmer record is missing when the event is built', async () => {
    const { pickup } = await createPickupRecord({ status: 'Collected' })
    vi.spyOn(farmerRepository, 'findById').mockResolvedValueOnce(null)

    const updated = await pickupService.complete(pickup._id.toString(), await opsActor(['pickups.manage']), {})
    expect(updated.status).toBe('Completed')
  })

  it('cancel throws not-found if the record disappears between findById and updateById', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    vi.spyOn(pickupRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(pickupService.cancel(pickup._id.toString(), { reason: 'x' }, await opsActor(['pickups.manage']), {})).rejects.toThrow(
      'Pickup not found',
    )
  })

  it('cancel falls back to an empty farmerUserId if the farmer record is missing when the event is built', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    vi.spyOn(farmerRepository, 'findById').mockResolvedValueOnce(null)

    const updated = await pickupService.cancel(pickup._id.toString(), { reason: 'x' }, await opsActor(['pickups.manage']), {})
    expect(updated.status).toBe('Cancelled')
  })

  it('updateRouteNotes throws not-found if the record disappears between findById and updateById', async () => {
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    vi.spyOn(pickupRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      pickupService.updateRouteNotes(pickup._id.toString(), { routeNotes: 'x' }, await opsActor(['pickups.manage']), {}),
    ).rejects.toThrow('Pickup not found')
  })
})
