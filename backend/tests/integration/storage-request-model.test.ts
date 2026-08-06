import { describe, expect, it } from 'vitest'
import { StorageRequest } from '../../src/models/storageRequest.model'
import { createFarmerRecord, createStorageRequestRecord } from '../utils/factories'

describe('StorageRequest model constraints', () => {
  it('rejects a duplicate active request for the same farmer + produce + harvest date at the database level', async () => {
    const { farmer } = await createFarmerRecord()
    const harvestDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    await createStorageRequestRecord({ farmerId: farmer._id, produceType: 'Maize', harvestDate, status: 'Draft' })

    await expect(
      createStorageRequestRecord({ farmerId: farmer._id, produceType: 'Maize', harvestDate, status: 'Submitted' }),
    ).rejects.toThrow()
  })

  it('allows two terminal-status requests for the same farmer + produce + harvest date', async () => {
    const { farmer } = await createFarmerRecord()
    const harvestDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    await createStorageRequestRecord({ farmerId: farmer._id, produceType: 'Maize', harvestDate, status: 'Rejected' })

    await expect(
      createStorageRequestRecord({ farmerId: farmer._id, produceType: 'Maize', harvestDate, status: 'Cancelled' }),
    ).resolves.toBeDefined()
  })

  it('rejects a duplicate requestNumber', async () => {
    await createStorageRequestRecord({ requestNumber: 'SR-90001' })
    await expect(createStorageRequestRecord({ requestNumber: 'SR-90001' })).rejects.toThrow()
  })

  it('rejects a non-positive quantity', async () => {
    const { farmer } = await createFarmerRecord()
    await expect(
      StorageRequest.create({
        requestNumber: 'SR-90002',
        farmerId: farmer._id,
        farmerName: 'X',
        farmerNumber: farmer.farmerNumber,
        district: farmer.district,
        region: farmer.region,
        produceType: 'Maize',
        quantity: 0,
        unit: 'kg',
        estimatedWeightKg: 500,
        harvestDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        pickupLocation: 'Farm Gate',
        preferredPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        preferredPickupTime: '08:00',
      }),
    ).rejects.toThrow()
  })

  it('rejects an invalid unit', async () => {
    const { farmer } = await createFarmerRecord()
    await expect(
      StorageRequest.create({
        requestNumber: 'SR-90003',
        farmerId: farmer._id,
        farmerName: 'X',
        farmerNumber: farmer.farmerNumber,
        district: farmer.district,
        region: farmer.region,
        produceType: 'Maize',
        quantity: 100,
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        unit: 'liters',
        estimatedWeightKg: 500,
        harvestDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        pickupLocation: 'Farm Gate',
        preferredPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        preferredPickupTime: '08:00',
      }),
    ).rejects.toThrow()
  })

  it('defaults status to Draft and priority to Normal', async () => {
    const { request } = await createStorageRequestRecord({ status: undefined, priority: undefined })
    expect(request.status).toBe('Draft')
    expect(request.priority).toBe('Normal')
  })
})
