import { BaseRepository } from './base.repository'
import { StorageRequest, type IStorageRequest } from '../models/storageRequest.model'

const ACTIVE_STATUSES = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Pickup Scheduled'] as const

export class StorageRequestRepository extends BaseRepository<IStorageRequest> {
  constructor() {
    super(StorageRequest)
  }

  /** Mirrors the schema's partial unique index — used to give a friendly 409 instead of surfacing the raw duplicate-key error. */
  async findActiveDuplicate(farmerId: string, produceType: string, harvestDate: Date): Promise<IStorageRequest | null> {
    return this.findOne({
      farmerId,
      produceType,
      harvestDate,
      status: { $in: ACTIVE_STATUSES },
    })
  }
}

export const storageRequestRepository = new StorageRequestRepository()
