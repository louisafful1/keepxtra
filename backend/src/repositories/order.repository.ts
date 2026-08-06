import { BaseRepository } from './base.repository'
import { Order, type IOrder } from '../models/order.model'

export class OrderRepository extends BaseRepository<IOrder> {
  constructor() {
    super(Order)
  }

  /** Every non-deleted order, for the sales stats summary — small enough to aggregate in memory. */
  async findAllActive(): Promise<IOrder[]> {
    return this.findMany({})
  }
}

export const orderRepository = new OrderRepository()
