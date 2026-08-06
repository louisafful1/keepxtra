import { qualityInspectionRepository } from '../repositories/qualityInspection.repository'
import { inventoryRepository } from '../repositories/inventory.repository'
import { inventoryMovementRepository } from '../repositories/inventoryMovement.repository'
import { farmerRepository } from '../repositories/farmer.repository'
import { userRepository } from '../repositories/user.repository'
import { auditService } from './audit.service'
import { getNextSequenceValue } from '../utils/counter'
import { toObjectId } from '../utils/mongoose'
import { loadActor } from '../utils/systemActor'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import { QUALITY_INSPECTION_EVENTS, qualityInspectionEvents } from '../events/qualityInspection.events'
import type { IQualityInspection, QualityGrade, QualityInspectionStatus } from '../models/qualityInspection.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { QualityInspectionDto, QualityInspectionStatsSummaryDto } from '../types/qualityInspection.dto'
import type { InventoryReceivedEvent } from '../events/inventory.events'
import type { AssignInspectorInput, QualityInspectionListQuery, SubmitInspectionInput } from '../validators/qualityInspection.validators'

export interface RequestMeta {
  ip?: string | null
}

const QUALITY_GRADES: QualityGrade[] = ['A', 'B', 'C', 'Rejected']
const ASSIGNABLE_STATUSES: QualityInspectionStatus[] = ['Pending']
const SUBMITTABLE_STATUSES: QualityInspectionStatus[] = ['Pending', 'In Progress']

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function describe(inspection: Pick<IQualityInspection, 'inspectionCode' | 'produceType'>): string {
  return `${inspection.inspectionCode} (${inspection.produceType})`
}

function toDto(inspection: IQualityInspection): QualityInspectionDto {
  return {
    id: inspection._id.toString(),
    inspectionCode: inspection.inspectionCode,
    inventoryId: inspection.inventoryId.toString(),
    inventoryCode: inspection.inventoryCode,
    produceType: inspection.produceType,
    warehouseId: inspection.warehouseId?.toString() ?? null,
    warehouseCode: inspection.warehouseCode,

    inspectorId: inspection.inspectorId?.toString() ?? null,
    status: inspection.status,

    qualityGrade: inspection.qualityGrade,
    photos: inspection.photos,
    defects: inspection.defects,
    notes: inspection.notes,

    inspectedQuantity: inspection.inspectedQuantity,
    acceptedQuantity: inspection.acceptedQuantity,
    rejectedQuantity: inspection.rejectedQuantity,

    assignedAt: inspection.assignedAt,
    inspectedAt: inspection.inspectedAt,

    createdAt: inspection.createdAt,
    updatedAt: inspection.updatedAt,
  }
}

/**
 * The extension point Module 4 promised: subscribed by
 * `qualityInspectionAutoCreate.listener.ts` to `INVENTORY_EVENTS.RECEIVED`.
 * Not exposed over HTTP — an inspection only ever comes into existence
 * this way.
 */
async function createFromReceivedInventory(event: InventoryReceivedEvent): Promise<QualityInspectionDto> {
  const existing = await qualityInspectionRepository.findByInventoryId(event.inventoryId)
  if (existing) return toDto(existing)

  const inventory = await inventoryRepository.findById(event.inventoryId)
  if (!inventory) throw ApiError.notFound('Inventory record not found')

  const actor = await loadActor(event.receivedBy)
  const inspectionCode = `QI-${String(await getNextSequenceValue('quality-inspection')).padStart(5, '0')}`

  const inspection = await qualityInspectionRepository.create({
    inspectionCode,
    inventoryId: inventory._id,
    inventoryCode: inventory.inventoryCode,
    produceType: inventory.produceType,
    warehouseId: inventory.warehouseId,
    warehouseCode: inventory.warehouseCode,
    createdBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Quality Inspection Auto-Created',
    entityType: 'QualityInspection',
    entityId: inspection._id.toString(),
    affectedRecord: describe(inspection),
    newValue: 'Pending',
    ip: null,
  })

  return toDto(inspection)
}

async function getById(id: string): Promise<QualityInspectionDto> {
  const inspection = await qualityInspectionRepository.findById(id)
  if (!inspection) throw ApiError.notFound('Quality inspection not found')
  return toDto(inspection)
}

async function list(query: QualityInspectionListQuery): Promise<{ data: QualityInspectionDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)
  const filter = buildFilterQuery<IQualityInspection>({
    search: query,
    searchableFields: ['inspectionCode', 'inventoryCode', 'produceType', 'warehouseCode'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status, qualityGrade: query.qualityGrade, warehouseId: query.warehouseId, inventoryId: query.inventoryId },
  })
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    qualityInspectionRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    qualityInspectionRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function assignInspector(id: string, input: AssignInspectorInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<QualityInspectionDto> {
  const inspection = await qualityInspectionRepository.findById(id)
  if (!inspection) throw ApiError.notFound('Quality inspection not found')
  if (!ASSIGNABLE_STATUSES.includes(inspection.status)) {
    throw ApiError.conflict(`Cannot assign an inspector to an inspection in "${inspection.status}" status`)
  }

  const inspector = await userRepository.findById(input.inspectorId)
  if (!inspector) throw ApiError.notFound('Inspector not found')

  const updated = await qualityInspectionRepository.updateById(id, {
    inspectorId: toObjectId(input.inspectorId),
    status: 'In Progress',
    assignedAt: new Date(),
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Quality inspection not found')

  await auditService.record({
    actor,
    action: 'Inspector Assigned',
    entityType: 'QualityInspection',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: 'Pending',
    newValue: `In Progress (${inspector.name})`,
    ip: meta.ip,
  })

  return toDto(updated)
}

async function submit(id: string, input: SubmitInspectionInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<QualityInspectionDto> {
  const inspection = await qualityInspectionRepository.findById(id)
  if (!inspection) throw ApiError.notFound('Quality inspection not found')
  if (!SUBMITTABLE_STATUSES.includes(inspection.status)) {
    throw ApiError.conflict(`Cannot submit findings for an inspection in "${inspection.status}" status`)
  }

  const rejectedQuantity = input.inspectedQuantity - input.acceptedQuantity
  const newStatus: 'Approved' | 'Partially Accepted' | 'Rejected' =
    rejectedQuantity === 0 ? 'Approved' : input.acceptedQuantity === 0 ? 'Rejected' : 'Partially Accepted'
  const inspectedAt = new Date()

  const updated = await qualityInspectionRepository.updateById(id, {
    status: newStatus,
    qualityGrade: input.qualityGrade,
    photos: input.photos,
    defects: input.defects,
    notes: input.notes ?? null,
    inspectedQuantity: input.inspectedQuantity,
    acceptedQuantity: input.acceptedQuantity,
    rejectedQuantity,
    inspectorId: inspection.inspectorId ?? toObjectId(actor.id),
    inspectedAt,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Quality inspection not found')

  const inventory = await inventoryRepository.findById(inspection.inventoryId.toString())

  if (rejectedQuantity > 0 && inventory && inventory.status === 'In Stock') {
    const quantityBefore = inventory.currentQuantity
    const quantityAfter = Math.max(0, quantityBefore - rejectedQuantity)
    await inventoryRepository.updateById(inventory._id.toString(), {
      currentQuantity: quantityAfter,
      status: quantityAfter === 0 ? 'Depleted' : 'In Stock',
      updatedBy: toObjectId(actor.id),
    })
    await inventoryMovementRepository.create({
      inventoryId: inventory._id,
      type: 'Adjustment',
      quantityChange: -rejectedQuantity,
      quantityBefore,
      quantityAfter,
      reason: `Quality inspection rejection (${updated.inspectionCode})`,
      fromWarehouseId: null,
      toWarehouseId: null,
      performedBy: toObjectId(actor.id),
    })
  }

  await auditService.record({
    actor,
    action: 'Inspection Submitted',
    entityType: 'QualityInspection',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: inspection.status,
    newValue: newStatus,
    ip: meta.ip,
  })

  const farmer = inventory ? await farmerRepository.findById(inventory.farmerId.toString()) : null
  qualityInspectionEvents.emit(QUALITY_INSPECTION_EVENTS.COMPLETED, {
    inspectionId: id,
    inspectionCode: updated.inspectionCode,
    inventoryId: inspection.inventoryId.toString(),
    farmerId: inventory?.farmerId.toString() ?? '',
    farmerUserId: farmer?.userId.toString() ?? '',
    status: newStatus,
    qualityGrade: input.qualityGrade,
    acceptedQuantity: input.acceptedQuantity,
    rejectedQuantity,
    inspectedBy: actor.id,
    inspectedAt,
  })

  return toDto(updated)
}

async function getStatsSummary(): Promise<QualityInspectionStatsSummaryDto> {
  const inspections = await qualityInspectionRepository.findAllActive()
  const decided = inspections.filter((i) => i.status === 'Approved' || i.status === 'Partially Accepted' || i.status === 'Rejected')

  const totalInspected = decided.reduce((sum, i) => sum + (i.inspectedQuantity ?? 0), 0)
  const totalAccepted = decided.reduce((sum, i) => sum + (i.acceptedQuantity ?? 0), 0)

  const byGrade = QUALITY_GRADES.reduce((acc, grade) => ({ ...acc, [grade]: 0 }), {} as Record<QualityGrade, number>)
  for (const inspection of decided) {
    if (inspection.qualityGrade) byGrade[inspection.qualityGrade] += 1
  }

  return {
    totalInspections: inspections.length,
    pendingCount: inspections.filter((i) => i.status === 'Pending' || i.status === 'In Progress').length,
    approvedCount: inspections.filter((i) => i.status === 'Approved').length,
    partiallyAcceptedCount: inspections.filter((i) => i.status === 'Partially Accepted').length,
    rejectedCount: inspections.filter((i) => i.status === 'Rejected').length,
    acceptanceRatePercent: totalInspected > 0 ? round2((totalAccepted / totalInspected) * 100) : 0,
    byGrade,
  }
}

export const qualityInspectionService = {
  createFromReceivedInventory,
  getById,
  list,
  assignInspector,
  submit,
  getStatsSummary,
}
