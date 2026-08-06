import { describe, expect, it } from 'vitest'
import { ColdRoom } from '../../src/models/coldRoom.model'
import { createColdRoomRecord, createWarehouseRecord } from '../utils/factories'

describe('ColdRoom model constraints', () => {
  it('rejects a duplicate coldRoomCode', async () => {
    await createColdRoomRecord({ coldRoomCode: 'CR-90001' })
    await expect(createColdRoomRecord({ coldRoomCode: 'CR-90001' })).rejects.toThrow()
  })

  it('rejects a non-positive capacityKg', async () => {
    const warehouse = await createWarehouseRecord()
    await expect(
      ColdRoom.create({
        coldRoomCode: 'CR-90002',
        warehouseId: warehouse._id,
        warehouseCode: warehouse.warehouseCode,
        warehouseName: warehouse.name,
        name: 'X',
        capacityKg: 0,
        targetTemperatureMinC: 0,
        targetTemperatureMaxC: 4,
        targetHumidityMinPercent: 85,
        targetHumidityMaxPercent: 95,
      }),
    ).rejects.toThrow()
  })

  it('rejects an invalid status', async () => {
    const warehouse = await createWarehouseRecord()
    await expect(
      ColdRoom.create({
        coldRoomCode: 'CR-90003',
        warehouseId: warehouse._id,
        warehouseCode: warehouse.warehouseCode,
        warehouseName: warehouse.name,
        name: 'X',
        capacityKg: 1000,
        targetTemperatureMinC: 0,
        targetTemperatureMaxC: 4,
        targetHumidityMinPercent: 85,
        targetHumidityMaxPercent: 95,
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        status: 'Closed',
      }),
    ).rejects.toThrow()
  })

  it('defaults status to Active and currentOccupancyKg to 0', async () => {
    const { coldRoom } = await createColdRoomRecord({ status: undefined, currentOccupancyKg: undefined })
    expect(coldRoom.status).toBe('Active')
    expect(coldRoom.currentOccupancyKg).toBe(0)
  })
})
