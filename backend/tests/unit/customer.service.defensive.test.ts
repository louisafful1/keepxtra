import { describe, expect, it, vi, afterEach } from 'vitest'
import { customerService } from '../../src/services/customer.service'
import { customerRepository } from '../../src/repositories/customer.repository'
import { createCustomerRecord, createFarmerRecord } from '../utils/factories'
import type { AuthenticatedUser } from '../../src/interfaces/auth.interface'
import type { IUser } from '../../src/models/user.model'

/** Same category as vehicle.service.defensive.test.ts. */

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
    permissions: ['sales.create'],
  }
}

async function opsActor(): Promise<AuthenticatedUser> {
  const { user } = await createFarmerRecord()
  return actorFrom(user)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CustomerService defensive branches', () => {
  it('update throws not-found if the record disappears between findById and updateById', async () => {
    const customer = await createCustomerRecord()
    vi.spyOn(customerRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(customerService.update(customer._id.toString(), { name: 'X' }, await opsActor(), {})).rejects.toThrow('Customer not found')
  })

  it('updateStatus throws not-found if the record disappears between findById and updateById', async () => {
    const customer = await createCustomerRecord()
    vi.spyOn(customerRepository, 'updateById').mockResolvedValueOnce(null)

    await expect(customerService.updateStatus(customer._id.toString(), { status: 'Inactive' }, await opsActor(), {})).rejects.toThrow(
      'Customer not found',
    )
  })

  it('softDelete throws not-found if the record disappears between findById and softDeleteById', async () => {
    const customer = await createCustomerRecord()
    vi.spyOn(customerRepository, 'softDeleteById').mockResolvedValueOnce(null)

    await expect(customerService.softDelete(customer._id.toString(), await opsActor(), {})).rejects.toThrow('Customer not found')
  })

  it('restore throws not-found if the record disappears between findDeletedById and restoreById', async () => {
    const customer = await createCustomerRecord()
    await customerRepository.softDeleteById(customer._id.toString())
    vi.spyOn(customerRepository, 'restoreById').mockResolvedValueOnce(null)

    await expect(customerService.restore(customer._id.toString(), await opsActor(), {})).rejects.toThrow('Customer not found')
  })
})
