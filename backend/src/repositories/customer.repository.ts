import { BaseRepository } from './base.repository'
import { Customer, type ICustomer } from '../models/customer.model'

export class CustomerRepository extends BaseRepository<ICustomer> {
  constructor() {
    super(Customer)
  }

  async findDeletedById(id: string): Promise<ICustomer | null> {
    return this.model.findOne({ _id: id, isDeleted: true }).exec()
  }

  async restoreById(id: string): Promise<ICustomer | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: true }, { $set: { isDeleted: false, deletedAt: null } }, { returnDocument: 'after' })
      .exec()
  }
}

export const customerRepository = new CustomerRepository()
