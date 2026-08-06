import { BaseRepository } from './base.repository'
import { ColdRoom, type IColdRoom } from '../models/coldRoom.model'

export class ColdRoomRepository extends BaseRepository<IColdRoom> {
  constructor() {
    super(ColdRoom)
  }

  /** `findById` excludes soft-deleted records by design — restore needs to find one specifically. */
  async findDeletedById(id: string): Promise<IColdRoom | null> {
    return this.model.findOne({ _id: id, isDeleted: true }).exec()
  }

  async restoreById(id: string): Promise<IColdRoom | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: true }, { $set: { isDeleted: false, deletedAt: null } }, { returnDocument: 'after' })
      .exec()
  }

  /** Every non-deleted cold room, for the aggregate stats summary — small enough to sum in memory rather than an aggregation pipeline. */
  async findAllActive(): Promise<IColdRoom[]> {
    return this.findMany({})
  }
}

export const coldRoomRepository = new ColdRoomRepository()
