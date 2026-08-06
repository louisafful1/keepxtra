import { describe, expect, it } from 'vitest'
import { Pickup } from '../../src/models/pickup.model'
import { createPickupRecord } from '../utils/factories'

describe('Pickup model constraints', () => {
  it('rejects a duplicate pickupNumber', async () => {
    await createPickupRecord({ pickupNumber: 'PU-90001' })
    await expect(createPickupRecord({ pickupNumber: 'PU-90002', storageRequestId: undefined })).resolves.toBeDefined()
    await expect(createPickupRecord({ pickupNumber: 'PU-90001' })).rejects.toThrow()
  })

  it('rejects a second pickup for the same storage request', async () => {
    const { request: sr } = await createPickupRecord()
    await expect(createPickupRecord({ storageRequestId: sr._id })).rejects.toThrow()
  })

  it('rejects a non-positive quantity', async () => {
    const { request: sr, farmer } = await createPickupRecord()
    await expect(
      Pickup.create({
        pickupNumber: 'PU-90003',
        storageRequestId: sr._id,
        requestNumber: sr.requestNumber,
        farmerId: farmer._id,
        farmerName: 'X',
        farmerNumber: farmer.farmerNumber,
        district: farmer.district,
        region: farmer.region,
        produceType: 'Maize',
        quantity: 0,
        unit: 'kg',
        estimatedWeightKg: 500,
        pickupLocation: 'Farm Gate',
      }),
    ).rejects.toThrow()
  })

  it('rejects an invalid unit', async () => {
    const { request: sr, farmer } = await createPickupRecord()
    await expect(
      Pickup.create({
        pickupNumber: 'PU-90004',
        storageRequestId: sr._id,
        requestNumber: sr.requestNumber,
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
        pickupLocation: 'Farm Gate',
      }),
    ).rejects.toThrow()
  })

  it('rejects an invalid status', async () => {
    const { request: sr, farmer } = await createPickupRecord()
    await expect(
      Pickup.create({
        pickupNumber: 'PU-90005',
        storageRequestId: sr._id,
        requestNumber: sr.requestNumber,
        farmerId: farmer._id,
        farmerName: 'X',
        farmerNumber: farmer.farmerNumber,
        district: farmer.district,
        region: farmer.region,
        produceType: 'Maize',
        quantity: 100,
        unit: 'kg',
        estimatedWeightKg: 500,
        pickupLocation: 'Farm Gate',
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        status: 'Delivered',
      }),
    ).rejects.toThrow()
  })

  it('defaults status to Pending', async () => {
    const { pickup } = await createPickupRecord({ status: undefined })
    expect(pickup.status).toBe('Pending')
  })
})
