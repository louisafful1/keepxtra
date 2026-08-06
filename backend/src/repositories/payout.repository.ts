import { BaseRepository } from './base.repository'
import { Payout, type IPayout } from '../models/payout.model'

export class PayoutRepository extends BaseRepository<IPayout> {
  constructor() {
    super(Payout)
  }

  async findByOrderAndFarmer(orderId: string, farmerId: string): Promise<IPayout | null> {
    return this.findOne({ orderId, farmerId })
  }

  async findByFarmerId(farmerId: string): Promise<IPayout[]> {
    return this.findMany({ filter: { farmerId } })
  }

  /** Every non-deleted payout, for the platform-wide stats summary — small enough to aggregate in memory. */
  async findAllActive(): Promise<IPayout[]> {
    return this.findMany({})
  }
}

export const payoutRepository = new PayoutRepository()
