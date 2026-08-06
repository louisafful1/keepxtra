import { describe, expect, it, vi, afterEach } from 'vitest'
import { inventoryService } from '../../src/services/inventory.service'
import { inventoryRepository } from '../../src/repositories/inventory.repository'
import { farmerRepository } from '../../src/repositories/farmer.repository'
import { storageRequestRepository } from '../../src/repositories/storageRequest.repository'
import { createFarmerRecord, createInventoryRecord, createPickupRecord, createWarehouseRecord } from '../utils/factories'
import { Inventory } from '../../src/models/inventory.model'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'
import type { PickupCompletedEvent } from '../../src/events/pickup.events'

/** Same category as pickup.service.defensive.test.ts and warehouse.service.defensive.test.ts. */

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
    permissions: ['inventory.manage'],
  }
}

async function opsActor(): Promise<AuthenticatedUser> {
  const { user } = await createFarmerRecord()
  return actorFrom(user)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('InventoryService.createFromCompletedPickup', () => {
  it('is idempotent — a duplicate event returns the already-created record instead of erroring', async () => {
    const { pickup, user } = await createPickupRecord({
      status: 'Completed',
      collectedQuantity: 480,
      collectedWeightKg: 480,
      collectedAt: new Date(),
    })
    const event: PickupCompletedEvent = {
      pickupId: pickup._id.toString(),
      pickupNumber: pickup.pickupNumber,
      storageRequestId: pickup.storageRequestId.toString(),
      farmerId: pickup.farmerId.toString(),
      farmerUserId: user._id.toString(),
      completedBy: user._id.toString(),
      completedAt: new Date(),
    }

    const first = await inventoryService.createFromCompletedPickup(event)
    const second = await inventoryService.createFromCompletedPickup(event)

    expect(second.id).toBe(first.id)
    const count = await Inventory.countDocuments({ pickupId: pickup._id }).exec()
    expect(count).toBe(1)
  })

  it('throws not-found if the pickup no longer exists', async () => {
    const { user } = await createFarmerRecord()
    const event: PickupCompletedEvent = {
      pickupId: '665f1a2b3c4d5e6f7a8b9c0d',
      pickupNumber: 'PU-99999',
      storageRequestId: '665f1a2b3c4d5e6f7a8b9c0e',
      farmerId: '665f1a2b3c4d5e6f7a8b9c0f',
      farmerUserId: user._id.toString(),
      completedBy: user._id.toString(),
      completedAt: new Date(),
    }

    await expect(inventoryService.createFromCompletedPickup(event)).rejects.toThrow('Pickup not found')
  })

  it('throws not-found if the storage request no longer exists', async () => {
    const { pickup, user } = await createPickupRecord({
      status: 'Completed',
      collectedQuantity: 480,
      collectedWeightKg: 480,
      collectedAt: new Date(),
    })
    const event: PickupCompletedEvent = {
      pickupId: pickup._id.toString(),
      pickupNumber: pickup.pickupNumber,
      storageRequestId: pickup.storageRequestId.toString(),
      farmerId: pickup.farmerId.toString(),
      farmerUserId: user._id.toString(),
      completedBy: user._id.toString(),
      completedAt: new Date(),
    }
    vi.spyOn(storageRequestRepository, 'findById').mockResolvedValueOnce(null)

    await expect(inventoryService.createFromCompletedPickup(event)).rejects.toThrow('Storage request not found')
  })
})

describe('InventoryService defensive branches', () => {
  it('receive throws not-found if the record disappears between findById and updateById', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord()
    vi.spyOn(inventoryRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      inventoryService.receive(inventory._id.toString(), { warehouseId: warehouse._id.toString(), shelfLifeDays: 14 }, await opsActor(), {}),
    ).rejects.toThrow('Inventory record not found')
  })

  it('receive falls back to an empty farmerUserId if the farmer record is missing when the event is built', async () => {
    const { inventory } = await createInventoryRecord({ status: 'Pending Placement' })
    const warehouse = await createWarehouseRecord()
    vi.spyOn(farmerRepository, 'findById').mockResolvedValueOnce(null)

    const updated = await inventoryService.receive(
      inventory._id.toString(),
      { warehouseId: warehouse._id.toString(), shelfLifeDays: 14 },
      await opsActor(),
      {},
    )
    expect(updated.status).toBe('In Stock')
  })

  it('adjust throws not-found if the record disappears between findById and updateById', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 100 })
    vi.spyOn(inventoryRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(inventoryService.adjust(inventory._id.toString(), { quantityChange: 10, reason: 'x' }, await opsActor(), {})).rejects.toThrow(
      'Inventory record not found',
    )
  })

  it('transfer throws not-found if the record disappears between findById and updateById', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    const warehouse = await createWarehouseRecord()
    vi.spyOn(inventoryRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      inventoryService.transfer(inventory._id.toString(), { warehouseId: warehouse._id.toString() }, await opsActor(), {}),
    ).rejects.toThrow('Inventory record not found')
  })

  it('dispose throws not-found if the record disappears between findById and updateById', async () => {
    const { inventory } = await createInventoryRecord({ status: 'In Stock' })
    vi.spyOn(inventoryRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(inventoryService.dispose(inventory._id.toString(), { reason: 'x' }, await opsActor(), {})).rejects.toThrow(
      'Inventory record not found',
    )
  })
})
