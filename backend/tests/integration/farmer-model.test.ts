import { describe, expect, it } from 'vitest'
import { Farmer } from '../../src/models/farmer.model'
import { createFarmerRecord } from '../utils/factories'
import { getNextSequenceValue } from '../../src/utils/counter'

describe('Farmer model constraints', () => {
  it('rejects a duplicate farmerNumber at the database level', async () => {
    await createFarmerRecord({ farmerNumber: 'FRM-90001' })

    await expect(createFarmerRecord({ farmerNumber: 'FRM-90001' })).rejects.toThrow()
  })

  it('rejects a farmer with no primary crops', async () => {
    const { user } = await createFarmerRecord()
    await expect(
      Farmer.create({
        userId: user._id,
        farmerNumber: 'FRM-90002',
        firstName: 'A',
        lastName: 'B',
        phone: '+233 20 000 0000',
        email: 'nocrop@keepxtra.com',
        farmName: 'Farm',
        farmLocation: 'Loc',
        district: 'District',
        region: 'Region',
        primaryCrops: [],
        preferredPaymentMethod: 'Mobile Money',
        mobileMoneyDetails: { provider: 'MTN', phoneNumber: '+233 20 000 0000' },
      }),
    ).rejects.toThrow()
  })

  it('rejects out-of-range GPS coordinates', async () => {
    const { user } = await createFarmerRecord()
    await expect(
      Farmer.create({
        userId: user._id,
        farmerNumber: 'FRM-90003',
        firstName: 'A',
        lastName: 'B',
        phone: '+233 20 000 0001',
        email: 'badgps@keepxtra.com',
        farmName: 'Farm',
        farmLocation: 'Loc',
        district: 'District',
        region: 'Region',
        gpsCoordinates: { lat: 200, lng: 10 },
        primaryCrops: ['Maize'],
        preferredPaymentMethod: 'Mobile Money',
        mobileMoneyDetails: { provider: 'MTN', phoneNumber: '+233 20 000 0001' },
      }),
    ).rejects.toThrow()
  })
})

describe('getNextSequenceValue', () => {
  it('increments atomically across concurrent calls', async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => getNextSequenceValue('smoke-test-sequence')))
    const unique = new Set(results)
    expect(unique.size).toBe(10)
    expect(Math.max(...results)).toBe(10)
  })
})
