import { describe, expect, it } from 'vitest'
import { Customer } from '../../src/models/customer.model'
import { createCustomerRecord } from '../utils/factories'

describe('Customer model constraints', () => {
  it('rejects a duplicate customerCode', async () => {
    await createCustomerRecord({ customerCode: 'CUS-90001' })
    await expect(createCustomerRecord({ customerCode: 'CUS-90001' })).rejects.toThrow()
  })

  it('rejects an invalid type', async () => {
    await expect(
      Customer.create({
        customerCode: 'CUS-90002',
        name: 'X',
        // @ts-expect-error -- intentionally invalid, asserting the schema's enum rejects it at runtime
        type: 'Farm',
        phone: '+233 24 000 0000',
        address: 'X',
      }),
    ).rejects.toThrow()
  })

  it('defaults status to Active', async () => {
    const customer = await createCustomerRecord({ status: undefined })
    expect(customer.status).toBe('Active')
  })
})
