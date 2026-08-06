import { describe, expect, it, vi, afterEach } from 'vitest'
import { qualityInspectionService } from '../../src/services/qualityInspection.service'
import { qualityInspectionRepository } from '../../src/repositories/qualityInspection.repository'
import { inventoryRepository } from '../../src/repositories/inventory.repository'
import { farmerRepository } from '../../src/repositories/farmer.repository'
import { createFarmerRecord, createQualityInspectionRecord } from '../utils/factories'
import { Inventory } from '../../src/models/inventory.model'
import { QualityInspection } from '../../src/models/qualityInspection.model'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'
import type { InventoryReceivedEvent } from '../../src/events/inventory.events'

/** Same category as inventory.service.defensive.test.ts and warehouse.service.defensive.test.ts. */

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
    permissions: ['inspections.manage'],
  }
}

async function opsActor(): Promise<AuthenticatedUser> {
  const { user } = await createFarmerRecord()
  return actorFrom(user)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('QualityInspectionService.createFromReceivedInventory', () => {
  it('is idempotent — a duplicate event returns the already-created record instead of erroring', async () => {
    const { inspection, inventory } = await createQualityInspectionRecord()
    const { user } = await createFarmerRecord()
    const event: InventoryReceivedEvent = {
      inventoryId: inventory._id.toString(),
      inventoryCode: inventory.inventoryCode,
      farmerId: inventory.farmerId.toString(),
      farmerUserId: user._id.toString(),
      produceType: inventory.produceType,
      warehouseId: 'wh-1',
      coldRoomId: null,
      receivedBy: user._id.toString(),
      receivedAt: new Date(),
    }

    const result = await qualityInspectionService.createFromReceivedInventory(event)
    expect(result.id).toBe(inspection._id.toString())
    const count = await QualityInspection.countDocuments({ inventoryId: inventory._id }).exec()
    expect(count).toBe(1)
  })

  it('throws not-found if the inventory record no longer exists', async () => {
    const { user } = await createFarmerRecord()
    const event: InventoryReceivedEvent = {
      inventoryId: '665f1a2b3c4d5e6f7a8b9c0d',
      inventoryCode: 'INV-99999',
      farmerId: '665f1a2b3c4d5e6f7a8b9c0e',
      farmerUserId: user._id.toString(),
      produceType: 'Tomatoes',
      warehouseId: 'wh-1',
      coldRoomId: null,
      receivedBy: user._id.toString(),
      receivedAt: new Date(),
    }

    await expect(qualityInspectionService.createFromReceivedInventory(event)).rejects.toThrow('Inventory record not found')
  })
})

describe('QualityInspectionService defensive branches', () => {
  it('assignInspector throws not-found if the record disappears between findById and updateById', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    const { user: inspector } = await createFarmerRecord()
    vi.spyOn(qualityInspectionRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      qualityInspectionService.assignInspector(inspection._id.toString(), { inspectorId: inspector._id.toString() }, await opsActor(), {}),
    ).rejects.toThrow('Quality inspection not found')
  })

  it('submit throws not-found if the record disappears between findById and updateById', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    vi.spyOn(qualityInspectionRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(
      qualityInspectionService.submit(
        inspection._id.toString(),
        { qualityGrade: 'A', inspectedQuantity: 100, acceptedQuantity: 100, photos: [], defects: [] },
        await opsActor(),
        {},
      ),
    ).rejects.toThrow('Quality inspection not found')
  })

  it('submit skips the inventory adjustment when the linked inventory is not In Stock', async () => {
    const { inspection, inventory } = await createQualityInspectionRecord({ status: 'Pending' })
    await Inventory.updateOne({ _id: inventory._id }, { $set: { status: 'Disposed', currentQuantity: 0 } }).exec()

    const updated = await qualityInspectionService.submit(
      inspection._id.toString(),
      { qualityGrade: 'B', inspectedQuantity: 100, acceptedQuantity: 60, photos: [], defects: [] },
      await opsActor(),
      {},
    )
    expect(updated.status).toBe('Partially Accepted')

    const stillDisposed = await Inventory.findById(inventory._id).exec()
    expect(stillDisposed?.currentQuantity).toBe(0)
  })

  it('submit falls back to an empty farmerId/farmerUserId if the linked inventory record is unexpectedly missing', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    vi.spyOn(inventoryRepository, 'findById').mockResolvedValueOnce(null)

    const updated = await qualityInspectionService.submit(
      inspection._id.toString(),
      { qualityGrade: 'A', inspectedQuantity: 100, acceptedQuantity: 100, photos: [], defects: [] },
      await opsActor(),
      {},
    )
    expect(updated.status).toBe('Approved')
  })

  it('submit falls back to an empty farmerUserId if the farmer record is missing when the event is built', async () => {
    const { inspection } = await createQualityInspectionRecord({ status: 'Pending' })
    vi.spyOn(farmerRepository, 'findById').mockResolvedValueOnce(null)

    const updated = await qualityInspectionService.submit(
      inspection._id.toString(),
      { qualityGrade: 'A', inspectedQuantity: 100, acceptedQuantity: 100, photos: [], defects: [] },
      await opsActor(),
      {},
    )
    expect(updated.status).toBe('Approved')
  })
})
