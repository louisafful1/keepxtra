import { describe, expect, it } from 'vitest'
import { Driver } from '../../src/models/driver.model'
import { createDriverRecord } from '../utils/factories'

describe('Driver model constraints', () => {
  it('rejects a duplicate driverCode', async () => {
    await createDriverRecord({ driverCode: 'DR-90001' })
    await expect(createDriverRecord({ driverCode: 'DR-90001', licenseNumber: 'OTHER-1' })).rejects.toThrow()
  })

  it('rejects a duplicate licenseNumber', async () => {
    await createDriverRecord({ licenseNumber: 'GHA-DL-90001' })
    await expect(createDriverRecord({ licenseNumber: 'GHA-DL-90001' })).rejects.toThrow()
  })

  it('rejects an invalid status', async () => {
    await expect(
      Driver.create({
        driverCode: 'DR-90002',
        name: 'X',
        phone: '+233 24 000 0000',
        licenseNumber: 'GHA-DL-90002',
        licenseExpiryDate: new Date(),
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        status: 'Retired',
      }),
    ).rejects.toThrow()
  })

  it('rejects a performanceRating outside 0-5', async () => {
    await expect(
      Driver.create({
        driverCode: 'DR-90003',
        name: 'X',
        phone: '+233 24 000 0000',
        licenseNumber: 'GHA-DL-90003',
        licenseExpiryDate: new Date(),
        performanceRating: 6,
      }),
    ).rejects.toThrow()
  })

  it('defaults status to Available and totalTripsCompleted to 0', async () => {
    const driver = await createDriverRecord({ status: undefined, totalTripsCompleted: undefined })
    expect(driver.status).toBe('Available')
    expect(driver.totalTripsCompleted).toBe(0)
  })
})
