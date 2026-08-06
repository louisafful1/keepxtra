import { describe, expect, it } from 'vitest'
import { Warehouse } from '../../src/models/warehouse.model'
import { createWarehouseRecord } from '../utils/factories'

describe('Warehouse model constraints', () => {
  it('rejects a duplicate warehouseCode', async () => {
    await createWarehouseRecord({ warehouseCode: 'WH-90001' })
    await expect(createWarehouseRecord({ warehouseCode: 'WH-90001' })).rejects.toThrow()
  })

  it('rejects a non-positive totalCapacityKg', async () => {
    await expect(
      Warehouse.create({
        warehouseCode: 'WH-90002',
        name: 'X',
        location: 'X',
        district: 'X',
        region: 'X',
        totalCapacityKg: 0,
      }),
    ).rejects.toThrow()
  })

  it('rejects an invalid status', async () => {
    await expect(
      Warehouse.create({
        warehouseCode: 'WH-90003',
        name: 'X',
        location: 'X',
        district: 'X',
        region: 'X',
        totalCapacityKg: 1000,
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        status: 'Closed',
      }),
    ).rejects.toThrow()
  })

  it('defaults status to Active and currentOccupancyKg to 0', async () => {
    const warehouse = await createWarehouseRecord({ status: undefined, currentOccupancyKg: undefined })
    expect(warehouse.status).toBe('Active')
    expect(warehouse.currentOccupancyKg).toBe(0)
  })
})
