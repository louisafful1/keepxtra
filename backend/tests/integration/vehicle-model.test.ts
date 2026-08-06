import { describe, expect, it } from 'vitest'
import { Vehicle } from '../../src/models/vehicle.model'
import { createVehicleRecord } from '../utils/factories'

describe('Vehicle model constraints', () => {
  it('rejects a duplicate vehicleCode', async () => {
    await createVehicleRecord({ vehicleCode: 'VH-90001' })
    await expect(createVehicleRecord({ vehicleCode: 'VH-90001', plateNumber: 'OTHER-1' })).rejects.toThrow()
  })

  it('rejects a duplicate plateNumber', async () => {
    await createVehicleRecord({ plateNumber: 'GT 90001-24' })
    await expect(createVehicleRecord({ plateNumber: 'GT 90001-24' })).rejects.toThrow()
  })

  it('rejects a non-positive capacityKg', async () => {
    await expect(
      Vehicle.create({ vehicleCode: 'VH-90002', plateNumber: 'GT 90002-24', type: 'Van', capacityKg: 0 }),
    ).rejects.toThrow()
  })

  it('rejects an invalid status', async () => {
    await expect(
      Vehicle.create({
        vehicleCode: 'VH-90003',
        plateNumber: 'GT 90003-24',
        type: 'Van',
        capacityKg: 1000,
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        status: 'Parked',
      }),
    ).rejects.toThrow()
  })

  it('defaults status to Available and currentMileageKm to 0', async () => {
    const vehicle = await createVehicleRecord({ status: undefined, currentMileageKm: undefined })
    expect(vehicle.status).toBe('Available')
    expect(vehicle.currentMileageKm).toBe(0)
  })
})
