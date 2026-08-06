import { createEventBus } from './eventBus'

export const QUALITY_INSPECTION_EVENTS = {
  COMPLETED: 'qualityInspection.completed',
} as const

export interface QualityInspectionCompletedEvent {
  inspectionId: string
  inspectionCode: string
  inventoryId: string
  farmerId: string
  farmerUserId: string
  status: 'Approved' | 'Partially Accepted' | 'Rejected'
  qualityGrade: string
  acceptedQuantity: number
  rejectedQuantity: number
  inspectedBy: string
  inspectedAt: Date
}

export interface QualityInspectionEventMap {
  [QUALITY_INSPECTION_EVENTS.COMPLETED]: QualityInspectionCompletedEvent
}

export const qualityInspectionEvents = createEventBus<QualityInspectionEventMap>()
