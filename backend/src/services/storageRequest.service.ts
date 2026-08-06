import { storageRequestRepository } from '../repositories/storageRequest.repository'
import { farmerRepository } from '../repositories/farmer.repository'
import { auditService } from './audit.service'
import { getNextSequenceValue } from '../utils/counter'
import { toObjectId } from '../utils/mongoose'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import { STORAGE_REQUEST_EVENTS, storageRequestEvents } from '../events/storageRequest.events'
import type { QueryFilter } from 'mongoose'
import type { IStorageRequest, StorageRequestStatus } from '../models/storageRequest.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { StorageRequestDto } from '../types/storageRequest.dto'
import type {
  CancelStorageRequestInput,
  CreateStorageRequestInput,
  RejectStorageRequestInput,
  StorageRequestListQuery,
  UpdateInternalNotesInput,
  UpdatePriorityInput,
  UpdateStorageRequestInput,
} from '../validators/storageRequest.validators'

export interface RequestMeta {
  ip?: string | null
}

/**
 * The state machine backing the STATUS FLOW diagram. `Approved`,
 * `Pickup Scheduled`, and `Completed` have no outgoing transitions reachable
 * from any endpoint in *this* phase — `Pickup Scheduled`/`Completed` exist
 * purely as the extension point the future Pickup module will drive once it
 * starts calling `storageRequestRepository.updateById(id, { status: 'Pickup
 * Scheduled' })` after handling `STORAGE_REQUEST_EVENTS.APPROVED`.
 *
 * Architecture note: the given endpoint list has no dedicated "start
 * review" action, so `approve`/`reject` accept a request in either
 * `Submitted` or `Under Review` — `Under Review` is a legitimate resting
 * state (reserved for a future "claim for review" action) but nothing in
 * this phase requires passing through it before a decision is made.
 */
const ALLOWED_TRANSITIONS: Record<StorageRequestStatus, StorageRequestStatus[]> = {
  Draft: ['Submitted', 'Cancelled'],
  Submitted: ['Under Review', 'Approved', 'Rejected', 'Cancelled'],
  'Under Review': ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Pickup Scheduled'],
  'Pickup Scheduled': ['Completed'],
  Completed: [],
  Rejected: [],
  Cancelled: [],
}

/** Once Approved (or beyond), the request is read-only except via the dedicated internal-notes endpoint. */
const EDITABLE_STATUSES: StorageRequestStatus[] = ['Draft', 'Submitted', 'Under Review']

function assertTransitionAllowed(current: StorageRequestStatus, target: StorageRequestStatus) {
  if (!ALLOWED_TRANSITIONS[current].includes(target)) {
    throw ApiError.conflict(`Cannot move a storage request from "${current}" to "${target}"`)
  }
}

function toDto(request: IStorageRequest): StorageRequestDto {
  return {
    id: request._id.toString(),
    requestNumber: request.requestNumber,
    farmerId: request.farmerId.toString(),
    farmerName: request.farmerName,
    farmerNumber: request.farmerNumber,
    district: request.district,
    region: request.region,

    produceType: request.produceType,
    quantity: request.quantity,
    unit: request.unit,
    estimatedWeightKg: request.estimatedWeightKg,
    harvestDate: request.harvestDate,
    pickupLocation: request.pickupLocation,
    gpsCoordinates: request.gpsCoordinates,
    preferredPickupDate: request.preferredPickupDate,
    preferredPickupTime: request.preferredPickupTime,
    specialInstructions: request.specialInstructions,
    photos: request.photos,

    status: request.status,
    requestedAt: request.requestedAt,

    approvedBy: request.approvedBy?.toString() ?? null,
    approvedAt: request.approvedAt,
    rejectedBy: request.rejectedBy?.toString() ?? null,
    rejectedAt: request.rejectedAt,
    rejectionReason: request.rejectionReason,
    cancelledBy: request.cancelledBy?.toString() ?? null,
    cancelledAt: request.cancelledAt,
    cancellationReason: request.cancellationReason,

    priority: request.priority,
    internalNotes: request.internalNotes,

    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  }
}

function describe(request: Pick<IStorageRequest, 'requestNumber' | 'produceType'>): string {
  return `${request.requestNumber} (${request.produceType})`
}

function isOwner(request: IStorageRequest, actor: AuthenticatedUser, farmerRecordId: string): boolean {
  return request.farmerId.toString() === farmerRecordId || request.farmerId.toString() === actor.id
}

async function requireOwnFarmer(actor: AuthenticatedUser) {
  const farmer = await farmerRepository.findByUserId(actor.id)
  if (!farmer) throw ApiError.forbidden('Only registered farmers can perform this action')
  return farmer
}

async function create(input: CreateStorageRequestInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<StorageRequestDto> {
  const farmer = await requireOwnFarmer(actor)

  const duplicate = await storageRequestRepository.findActiveDuplicate(farmer._id.toString(), input.produceType, input.harvestDate)
  if (duplicate) {
    throw ApiError.conflict('You already have an active storage request for this produce and harvest date')
  }

  const requestNumber = `SR-${String(await getNextSequenceValue('storage-request')).padStart(5, '0')}`

  const request = await storageRequestRepository.create({
    requestNumber,
    farmerId: farmer._id,
    farmerName: `${farmer.firstName} ${farmer.lastName}`,
    farmerNumber: farmer.farmerNumber,
    district: farmer.district,
    region: farmer.region,

    produceType: input.produceType,
    quantity: input.quantity,
    unit: input.unit,
    estimatedWeightKg: input.estimatedWeightKg,
    harvestDate: input.harvestDate,
    pickupLocation: input.pickupLocation,
    gpsCoordinates: input.gpsCoordinates ?? null,
    preferredPickupDate: input.preferredPickupDate,
    preferredPickupTime: input.preferredPickupTime,
    specialInstructions: input.specialInstructions ?? null,
    // Always present — `createStorageRequestSchema` applies `.default([])`.
    photos: input.photos,

    createdBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Storage Request Created',
    entityType: 'StorageRequest',
    entityId: request._id.toString(),
    affectedRecord: describe(request),
    newValue: 'Draft',
    ip: meta.ip,
  })

  return toDto(request)
}

async function getById(id: string, actor: AuthenticatedUser): Promise<StorageRequestDto> {
  const request = await storageRequestRepository.findById(id)
  if (!request) throw ApiError.notFound('Storage request not found')

  if (!actor.permissions.includes('storage-requests.read')) {
    const farmer = await requireOwnFarmer(actor)
    if (!isOwner(request, actor, farmer._id.toString())) {
      throw ApiError.forbidden('You do not have permission to view this storage request')
    }
  }

  return toDto(request)
}

async function list(query: StorageRequestListQuery, actor: AuthenticatedUser): Promise<{ data: StorageRequestDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)

  const baseFilter = buildFilterQuery<IStorageRequest>({
    search: query,
    searchableFields: ['requestNumber', 'farmerName', 'farmerNumber', 'produceType', 'district', 'region'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status, priority: query.priority, produceType: query.produceType, region: query.region },
  })

  const and: QueryFilter<IStorageRequest>[] = [baseFilter]

  if (query.harvestDateFrom || query.harvestDateTo) {
    const range: Record<string, Date> = {}
    if (query.harvestDateFrom) range.$gte = new Date(query.harvestDateFrom)
    if (query.harvestDateTo) range.$lte = new Date(query.harvestDateTo)
    and.push({ harvestDate: range })
  }

  if (query.pickupDateFrom || query.pickupDateTo) {
    const range: Record<string, Date> = {}
    if (query.pickupDateFrom) range.$gte = new Date(query.pickupDateFrom)
    if (query.pickupDateTo) range.$lte = new Date(query.pickupDateTo)
    and.push({ preferredPickupDate: range })
  }

  if (!actor.permissions.includes('storage-requests.read')) {
    const farmer = await requireOwnFarmer(actor)
    and.push({ farmerId: farmer._id })
  }

  const filter: QueryFilter<IStorageRequest> = and.length === 1 ? and[0]! : { $and: and }
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    storageRequestRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    storageRequestRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function submit(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<StorageRequestDto> {
  const farmer = await requireOwnFarmer(actor)
  const request = await storageRequestRepository.findById(id)
  if (!request) throw ApiError.notFound('Storage request not found')
  if (!isOwner(request, actor, farmer._id.toString())) throw ApiError.forbidden('You do not have permission to submit this storage request')

  assertTransitionAllowed(request.status, 'Submitted')

  const requestedAt = new Date()
  const updated = await storageRequestRepository.updateById(id, { status: 'Submitted', requestedAt, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Storage request not found')

  await auditService.record({
    actor,
    action: 'Submitted',
    entityType: 'StorageRequest',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: 'Draft',
    newValue: 'Submitted',
    ip: meta.ip,
  })

  storageRequestEvents.emit(STORAGE_REQUEST_EVENTS.SUBMITTED, {
    storageRequestId: id,
    requestNumber: updated.requestNumber,
    farmerId: farmer._id.toString(),
    farmerUserId: actor.id,
    submittedAt: requestedAt,
  })

  return toDto(updated)
}

async function approve(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<StorageRequestDto> {
  const request = await storageRequestRepository.findById(id)
  if (!request) throw ApiError.notFound('Storage request not found')

  assertTransitionAllowed(request.status, 'Approved')

  const previousStatus = request.status
  const approvedAt = new Date()
  const updated = await storageRequestRepository.updateById(id, {
    status: 'Approved',
    approvedBy: toObjectId(actor.id),
    approvedAt,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Storage request not found')

  await auditService.record({
    actor,
    action: 'Approved',
    entityType: 'StorageRequest',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousStatus,
    newValue: 'Approved',
    ip: meta.ip,
  })

  const farmer = await farmerRepository.findById(request.farmerId.toString())
  storageRequestEvents.emit(STORAGE_REQUEST_EVENTS.APPROVED, {
    storageRequestId: id,
    requestNumber: updated.requestNumber,
    farmerId: request.farmerId.toString(),
    farmerUserId: farmer?.userId.toString() ?? '',
    approvedBy: actor.id,
    approvedAt,
  })

  return toDto(updated)
}

async function reject(id: string, input: RejectStorageRequestInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<StorageRequestDto> {
  const request = await storageRequestRepository.findById(id)
  if (!request) throw ApiError.notFound('Storage request not found')

  assertTransitionAllowed(request.status, 'Rejected')

  const previousStatus = request.status
  const rejectedAt = new Date()
  const updated = await storageRequestRepository.updateById(id, {
    status: 'Rejected',
    rejectedBy: toObjectId(actor.id),
    rejectedAt,
    rejectionReason: input.reason,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Storage request not found')

  await auditService.record({
    actor,
    action: 'Rejected',
    entityType: 'StorageRequest',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousStatus,
    newValue: `Rejected — ${input.reason}`,
    ip: meta.ip,
  })

  const farmer = await farmerRepository.findById(request.farmerId.toString())
  storageRequestEvents.emit(STORAGE_REQUEST_EVENTS.REJECTED, {
    storageRequestId: id,
    requestNumber: updated.requestNumber,
    farmerId: request.farmerId.toString(),
    farmerUserId: farmer?.userId.toString() ?? '',
    rejectedBy: actor.id,
    rejectedAt,
    reason: input.reason,
  })

  return toDto(updated)
}

async function cancel(id: string, input: CancelStorageRequestInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<StorageRequestDto> {
  const farmer = await requireOwnFarmer(actor)
  const request = await storageRequestRepository.findById(id)
  if (!request) throw ApiError.notFound('Storage request not found')
  if (!isOwner(request, actor, farmer._id.toString())) throw ApiError.forbidden('You do not have permission to cancel this storage request')

  assertTransitionAllowed(request.status, 'Cancelled')

  const previousStatus = request.status
  const cancelledAt = new Date()
  const updated = await storageRequestRepository.updateById(id, {
    status: 'Cancelled',
    cancelledBy: toObjectId(actor.id),
    cancelledAt,
    cancellationReason: input.reason ?? null,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Storage request not found')

  await auditService.record({
    actor,
    action: 'Cancelled',
    entityType: 'StorageRequest',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousStatus,
    newValue: 'Cancelled',
    ip: meta.ip,
  })

  storageRequestEvents.emit(STORAGE_REQUEST_EVENTS.CANCELLED, {
    storageRequestId: id,
    requestNumber: updated.requestNumber,
    farmerId: farmer._id.toString(),
    farmerUserId: actor.id,
    cancelledBy: actor.id,
    cancelledAt,
    reason: input.reason ?? null,
  })

  return toDto(updated)
}

async function update(id: string, input: UpdateStorageRequestInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<StorageRequestDto> {
  const request = await storageRequestRepository.findById(id)
  if (!request) throw ApiError.notFound('Storage request not found')

  if (!EDITABLE_STATUSES.includes(request.status)) {
    throw ApiError.conflict(`A request in "${request.status}" status can no longer be edited`)
  }

  const changedKeys = Object.keys(input) as (keyof IStorageRequest)[]
  const before = request as unknown as Record<string, unknown>

  const updated = await storageRequestRepository.updateById(id, { ...input, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Storage request not found')

  const after = updated as unknown as Record<string, unknown>
  await auditService.record({
    actor,
    action: 'Updated',
    entityType: 'StorageRequest',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, before[key]]))),
    newValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, after[key]]))),
    ip: meta.ip,
  })

  return toDto(updated)
}

async function updatePriority(id: string, input: UpdatePriorityInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<StorageRequestDto> {
  const request = await storageRequestRepository.findById(id)
  if (!request) throw ApiError.notFound('Storage request not found')

  if (!EDITABLE_STATUSES.includes(request.status)) {
    throw ApiError.conflict(`A request in "${request.status}" status can no longer be edited`)
  }

  const previousPriority = request.priority
  const updated = await storageRequestRepository.updateById(id, { priority: input.priority, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Storage request not found')

  await auditService.record({
    actor,
    action: 'Priority Changed',
    entityType: 'StorageRequest',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousPriority,
    newValue: input.priority,
    ip: meta.ip,
  })

  return toDto(updated)
}

async function updateInternalNotes(
  id: string,
  input: UpdateInternalNotesInput,
  actor: AuthenticatedUser,
  meta: RequestMeta,
): Promise<StorageRequestDto> {
  const request = await storageRequestRepository.findById(id)
  if (!request) throw ApiError.notFound('Storage request not found')

  // The one field that stays editable regardless of status — "Approved
  // requests become read-only except for Operations notes".
  const previousNotes = request.internalNotes
  const updated = await storageRequestRepository.updateById(id, { internalNotes: input.internalNotes, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Storage request not found')

  await auditService.record({
    actor,
    action: 'Internal Notes Updated',
    entityType: 'StorageRequest',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousNotes,
    newValue: input.internalNotes,
    ip: meta.ip,
  })

  return toDto(updated)
}

export const storageRequestService = {
  create,
  getById,
  list,
  submit,
  approve,
  reject,
  cancel,
  update,
  updatePriority,
  updateInternalNotes,
}
