import { describe, expect, it, vi, afterEach } from 'vitest'
import { storageRequestService } from '../../src/services/storageRequest.service'
import { storageRequestRepository } from '../../src/repositories/storageRequest.repository'
import { farmerRepository } from '../../src/repositories/farmer.repository'
import { createFarmerRecord, createStorageRequestRecord } from '../utils/factories'
import { STORAGE_REQUEST_EVENTS, storageRequestEvents } from '../../src/events/storageRequest.events'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'

/**
 * These exercise defensive branches that are effectively unreachable
 * through the real HTTP flow — a `findById` that finds a record,
 * immediately followed by an `updateById` that (in normal operation) can
 * never fail to find the same record a few milliseconds later. They exist
 * as a safety net against a genuine race condition (e.g. a concurrent hard
 * delete), and the module's 100%-coverage target means they're worth
 * verifying directly rather than leaving untested.
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
  const { user } = await createFarmerRecord() // any User works — only id/permissions matter here
  return actorFrom(user, 'Operations', permissions)
}

function farmerActor(user: IUser): AuthenticatedUser {
  return actorFrom(user, 'Farmer', [])
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('StorageRequestService defensive branches', () => {
  it('submit throws not-found if the record disappears between findById and updateById', async () => {
    const { farmer, user } = await createFarmerRecord()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id, status: 'Draft' })
    vi.spyOn(storageRequestRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(storageRequestService.submit(sr._id.toString(), farmerActor(user), {})).rejects.toThrow(
      'Storage request not found',
    )
  })

  it('approve throws not-found if the record disappears between findById and updateById', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    vi.spyOn(storageRequestRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(storageRequestService.approve(sr._id.toString(), await opsActor(['storage-requests.review']), {})).rejects.toThrow(
      'Storage request not found',
    )
  })

  it('approve falls back to an empty farmerUserId if the farmer record is missing when the event is built', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    vi.spyOn(farmerRepository, 'findById').mockResolvedValueOnce(null)

    const received: { farmerUserId: string }[] = []
    const listener = (event: { farmerUserId: string }) => received.push(event)
    storageRequestEvents.on(STORAGE_REQUEST_EVENTS.APPROVED, listener)

    try {
      await storageRequestService.approve(sr._id.toString(), await opsActor(['storage-requests.review']), {})
      expect(received).toHaveLength(1)
      expect(received[0]!.farmerUserId).toBe('')
    } finally {
      storageRequestEvents.off(STORAGE_REQUEST_EVENTS.APPROVED, listener)
    }
  })

  it('reject throws not-found if the record disappears between findById and updateById', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    vi.spyOn(storageRequestRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      storageRequestService.reject(sr._id.toString(), { reason: 'x' }, await opsActor(['storage-requests.review']), {}),
    ).rejects.toThrow('Storage request not found')
  })

  it('reject falls back to an empty farmerUserId if the farmer record is missing when the event is built', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Submitted' })
    vi.spyOn(farmerRepository, 'findById').mockResolvedValueOnce(null)

    const received: { farmerUserId: string }[] = []
    const listener = (event: { farmerUserId: string }) => received.push(event)
    storageRequestEvents.on(STORAGE_REQUEST_EVENTS.REJECTED, listener)

    try {
      await storageRequestService.reject(sr._id.toString(), { reason: 'x' }, await opsActor(['storage-requests.review']), {})
      expect(received).toHaveLength(1)
      expect(received[0]!.farmerUserId).toBe('')
    } finally {
      storageRequestEvents.off(STORAGE_REQUEST_EVENTS.REJECTED, listener)
    }
  })

  it('cancel throws not-found if the record disappears between findById and updateById', async () => {
    const { farmer, user } = await createFarmerRecord()
    const { request: sr } = await createStorageRequestRecord({ farmerId: farmer._id, status: 'Draft' })
    vi.spyOn(storageRequestRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(storageRequestService.cancel(sr._id.toString(), {}, farmerActor(user), {})).rejects.toThrow(
      'Storage request not found',
    )
  })

  it('update throws not-found if the record disappears between findById and updateById', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    vi.spyOn(storageRequestRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      storageRequestService.update(sr._id.toString(), { quantity: 999 }, await opsActor(['storage-requests.update']), {}),
    ).rejects.toThrow('Storage request not found')
  })

  it('updatePriority throws not-found if the record disappears between findById and updateById', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    vi.spyOn(storageRequestRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      storageRequestService.updatePriority(sr._id.toString(), { priority: 'Urgent' }, await opsActor(['storage-requests.update']), {}),
    ).rejects.toThrow('Storage request not found')
  })

  it('updateInternalNotes throws not-found if the record disappears between findById and updateById', async () => {
    const { request: sr } = await createStorageRequestRecord({ status: 'Draft' })
    vi.spyOn(storageRequestRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      storageRequestService.updateInternalNotes(sr._id.toString(), { internalNotes: 'x' }, await opsActor(['storage-requests.update']), {}),
    ).rejects.toThrow('Storage request not found')
  })
})
