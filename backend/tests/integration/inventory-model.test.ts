import { describe, expect, it } from 'vitest'
import { Inventory } from '../../src/models/inventory.model'
import { createInventoryRecord } from '../utils/factories'

describe('Inventory model constraints', () => {
  it('rejects a duplicate inventoryCode', async () => {
    await createInventoryRecord({ inventoryCode: 'INV-90001' })
    await expect(createInventoryRecord({ inventoryCode: 'INV-90001' })).rejects.toThrow()
  })

  it('rejects a second inventory record for the same pickup', async () => {
    const { pickup } = await createInventoryRecord()
    await expect(createInventoryRecord({ pickupId: pickup._id })).rejects.toThrow()
  })

  it('rejects a non-positive initialQuantity', async () => {
    const { pickup, request: sr } = await createInventoryRecord()
    await expect(
      Inventory.create({
        inventoryCode: 'INV-90002',
        pickupId: pickup._id,
        storageRequestId: sr._id,
        requestNumber: sr.requestNumber,
        farmerId: pickup.farmerId,
        farmerName: pickup.farmerName,
        farmerNumber: pickup.farmerNumber,
        produceType: pickup.produceType,
        unit: pickup.unit,
        harvestDate: sr.harvestDate,
        initialQuantity: 0,
        currentQuantity: 0,
      }),
    ).rejects.toThrow()
  })

  it('rejects an invalid status', async () => {
    const { pickup, request: sr } = await createInventoryRecord()
    await expect(
      Inventory.create({
        inventoryCode: 'INV-90003',
        pickupId: pickup._id,
        storageRequestId: sr._id,
        requestNumber: sr.requestNumber,
        farmerId: pickup.farmerId,
        farmerName: pickup.farmerName,
        farmerNumber: pickup.farmerNumber,
        produceType: pickup.produceType,
        unit: pickup.unit,
        harvestDate: sr.harvestDate,
        initialQuantity: 100,
        currentQuantity: 100,
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        status: 'Sold',
      }),
    ).rejects.toThrow()
  })

  it('defaults status to Pending Placement and reservedQuantity to 0', async () => {
    const { inventory } = await createInventoryRecord({ status: undefined, reservedQuantity: undefined })
    expect(inventory.status).toBe('Pending Placement')
    expect(inventory.reservedQuantity).toBe(0)
  })
})
