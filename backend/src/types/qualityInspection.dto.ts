import type { QualityGrade, QualityInspectionStatus } from '../models/qualityInspection.model'

export interface QualityInspectionDto {
  id: string
  inspectionCode: string
  inventoryId: string
  inventoryCode: string
  produceType: string
  warehouseId: string | null
  warehouseCode: string | null

  inspectorId: string | null
  status: QualityInspectionStatus

  qualityGrade: QualityGrade | null
  photos: string[]
  defects: string[]
  notes: string | null

  inspectedQuantity: number | null
  acceptedQuantity: number | null
  rejectedQuantity: number | null

  assignedAt: Date | null
  inspectedAt: Date | null

  createdAt: Date
  updatedAt: Date
}

export interface QualityInspectionStatsSummaryDto {
  totalInspections: number
  pendingCount: number
  approvedCount: number
  partiallyAcceptedCount: number
  rejectedCount: number
  acceptanceRatePercent: number
  byGrade: Record<QualityGrade, number>
}
