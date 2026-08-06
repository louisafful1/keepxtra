import { BaseRepository } from './base.repository'
import { QualityInspection, type IQualityInspection } from '../models/qualityInspection.model'

export class QualityInspectionRepository extends BaseRepository<IQualityInspection> {
  constructor() {
    super(QualityInspection)
  }

  async findByInventoryId(inventoryId: string): Promise<IQualityInspection | null> {
    return this.findOne({ inventoryId })
  }

  /** Every non-deleted inspection, for the stats summary — small enough to aggregate in memory. */
  async findAllActive(): Promise<IQualityInspection[]> {
    return this.findMany({})
  }
}

export const qualityInspectionRepository = new QualityInspectionRepository()
