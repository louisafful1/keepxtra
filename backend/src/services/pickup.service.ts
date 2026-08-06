import { pickupRepository } from '../repositories/pickup.repository'
import { farmerRepository } from '../repositories/farmer.repository'
import { storageRequestRepository } from '../repositories/storageRequest.repository'
import { auditService } from './audit.service'
import { getNextSequenceValue } from '../utils/counter'
import { toObjectId } from '../utils/mongoose'
import { loadActor } from '../utils/systemActor'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import { PICKUP_EVENTS, pickupEvents } from '../events/pickup.events'
import type { QueryFilter } from 'mongoose'
import type { IPickup, PickupStatus } from '../models/pickup.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { PickupDto } from '../types/pickup.dto'
import type { StorageRequestApprovedEvent } from '../events/storageRequest.events'
import type {
  CancelPickupInput,
  CollectPickupInput,
  PickupListQuery,
  SchedulePickupInput,
  UpdateRouteNotesInput,
} from '../validators/pickup.validators'

export interface RequestMeta {
  ip?: string | null
}

/**
 * The pickup lifecycle. `Pending` is the record's birth state (set by
 * `createFromApprovedStorageRequest`, never reachable again); everything
 * else follows the real-world sequence a driver moves through. `Cancelled`
 * is reachable from anything before `Collected` — once produce is
 * physically in hand, the operation must be seen through to `Completed`.
 */
const ALLOWED_TRANSITIONS: Record<PickupStatus, PickupStatus[]> = {
  Pending: ['Scheduled', 'Cancelled'],
  Scheduled: ['En Route', 'Cancelled'],
  'En Route': ['Arrived', 'Cancelled'],
  Arrived: ['Collected', 'Cancelled'],
  Collected: ['Completed'],
  Completed: [],
  Cancelled: [],
}

const CANCELLABLE_STATUSES: PickupStatus[] = ['Pending', 'Scheduled', 'En Route', 'Arrived']

function assertTransitionAllowed(current: PickupStatus, target: PickupStatus) {
  if (!ALLOWED_TRANSITIONS[current].includes(target)) {
    throw ApiError.conflict(`Cannot move a pickup from "${current}" to "${target}"`)
  }
}

function toDto(pickup: IPickup): PickupDto {
  return {
    id: pickup._id.toString(),
    pickupNumber: pickup.pickupNumber,
    storageRequestId: pickup.storageRequestId.toString(),
    requestNumber: pickup.requestNumber,
    farmerId: pickup.farmerId.toString(),
    farmerName: pickup.farmerName,
    farmerNumber: pickup.farmerNumber,
    district: pickup.district,
    region: pickup.region,

    produceType: pickup.produceType,
    quantity: pickup.quantity,
    unit: pickup.unit,
    estimatedWeightKg: pickup.estimatedWeightKg,
    pickupLocation: pickup.pickupLocation,
    gpsCoordinates: pickup.gpsCoordinates,

    scheduledDate: pickup.scheduledDate,
    scheduledTime: pickup.scheduledTime,
    driverName: pickup.driverName,
    driverPhone: pickup.driverPhone,
    vehiclePlateNumber: pickup.vehiclePlateNumber,
    vehicleType: pickup.vehicleType,
    routeNotes: pickup.routeNotes,

    status: pickup.status,

    collectedQuantity: pickup.collectedQuantity,
    collectedWeightKg: pickup.collectedWeightKg,
    collectionGpsCoordinates: pickup.collectionGpsCoordinates,
    collectionPhotos: pickup.collectionPhotos,
    collectionNotes: pickup.collectionNotes,
    collectedBy: pickup.collectedBy?.toString() ?? null,
    collectedAt: pickup.collectedAt,

    completedBy: pickup.completedBy?.toString() ?? null,
    completedAt: pickup.completedAt,

    cancelledBy: pickup.cancelledBy?.toString() ?? null,
    cancelledAt: pickup.cancelledAt,
    cancellationReason: pickup.cancellationReason,

    createdAt: pickup.createdAt,
    updatedAt: pickup.updatedAt,
  }
}

function describe(pickup: Pick<IPickup, 'pickupNumber' | 'produceType'>): string {
  return `${pickup.pickupNumber} (${pickup.produceType})`
}

function canManage(actor: AuthenticatedUser): boolean {
  return actor.permissions.includes('pickups.manage')
}

async function requireOwnFarmer(actor: AuthenticatedUser) {
  const farmer = await farmerRepository.findByUserId(actor.id)
  if (!farmer) throw ApiError.forbidden('Only registered farmers can perform this action')
  return farmer
}

/**
 * The event-driven automation promised in the Storage Request phase,
 * fulfilled: subscribed by `pickupAutoCreate.listener.ts` to
 * `STORAGE_REQUEST_EVENTS.APPROVED`. Not exposed over HTTP — a Pickup only
 * ever comes into existence this way.
 */
async function createFromApprovedStorageRequest(event: StorageRequestApprovedEvent): Promise<PickupDto> {
  const existing = await pickupRepository.findByStorageRequestId(event.storageRequestId)
  if (existing) return toDto(existing)

  const storageRequest = await storageRequestRepository.findById(event.storageRequestId)
  if (!storageRequest) throw ApiError.notFound('Storage request not found')

  const actor = await loadActor(event.approvedBy)
  const pickupNumber = `PU-${String(await getNextSequenceValue('pickup')).padStart(5, '0')}`

  const pickup = await pickupRepository.create({
    pickupNumber,
    storageRequestId: storageRequest._id,
    requestNumber: storageRequest.requestNumber,
    farmerId: storageRequest.farmerId,
    farmerName: storageRequest.farmerName,
    farmerNumber: storageRequest.farmerNumber,
    district: storageRequest.district,
    region: storageRequest.region,

    produceType: storageRequest.produceType,
    quantity: storageRequest.quantity,
    unit: storageRequest.unit,
    estimatedWeightKg: storageRequest.estimatedWeightKg,
    pickupLocation: storageRequest.pickupLocation,
    gpsCoordinates: storageRequest.gpsCoordinates,

    createdBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Pickup Auto-Created',
    entityType: 'Pickup',
    entityId: pickup._id.toString(),
    affectedRecord: describe(pickup),
    newValue: 'Pending',
    ip: null,
  })

  return toDto(pickup)
}

async function getById(id: string, actor: AuthenticatedUser): Promise<PickupDto> {
  const pickup = await pickupRepository.findById(id)
  if (!pickup) throw ApiError.notFound('Pickup not found')

  if (!canManage(actor)) {
    const farmer = await requireOwnFarmer(actor)
    if (pickup.farmerId.toString() !== farmer._id.toString()) {
      throw ApiError.forbidden('You do not have permission to view this pickup')
    }
  }

  return toDto(pickup)
}

async function list(query: PickupListQuery, actor: AuthenticatedUser): Promise<{ data: PickupDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)

  const baseFilter = buildFilterQuery<IPickup>({
    search: query,
    searchableFields: ['pickupNumber', 'requestNumber', 'farmerName', 'farmerNumber', 'produceType', 'driverName', 'district', 'region'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status, produceType: query.produceType, region: query.region },
  })

  const and: QueryFilter<IPickup>[] = [baseFilter]

  if (query.scheduledDateFrom || query.scheduledDateTo) {
    const range: Record<string, Date> = {}
    if (query.scheduledDateFrom) range.$gte = new Date(query.scheduledDateFrom)
    if (query.scheduledDateTo) range.$lte = new Date(query.scheduledDateTo)
    and.push({ scheduledDate: range })
  }

  if (!canManage(actor)) {
    const farmer = await requireOwnFarmer(actor)
    and.push({ farmerId: farmer._id })
  }

  const filter: QueryFilter<IPickup> = and.length === 1 ? and[0]! : { $and: and }
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    pickupRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    pickupRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function schedule(id: string, input: SchedulePickupInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<PickupDto> {
  const pickup = await pickupRepository.findById(id)
  if (!pickup) throw ApiError.notFound('Pickup not found')

  // `Scheduled` is also a valid *current* status here — assigning a driver
  // twice (a reschedule) is a normal operational action, not a transition.
  if (pickup.status !== 'Pending' && pickup.status !== 'Scheduled') {
    throw ApiError.conflict(`Cannot schedule a pickup in "${pickup.status}" status`)
  }
  const wasFirstSchedule = pickup.status === 'Pending'

  const updated = await pickupRepository.updateById(id, {
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    driverName: input.driverName,
    driverPhone: input.driverPhone,
    vehiclePlateNumber: input.vehiclePlateNumber,
    vehicleType: input.vehicleType,
    routeNotes: input.routeNotes ?? pickup.routeNotes,
    status: 'Scheduled',
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Pickup not found')

  // The other half of the automation: a scheduled pickup is what actually
  // moves the Storage Request past `Approved` — see the ALLOWED_TRANSITIONS
  // note in storageRequest.service.ts.
  if (wasFirstSchedule) {
    await storageRequestRepository.updateById(pickup.storageRequestId.toString(), { status: 'Pickup Scheduled' })
  }

  await auditService.record({
    actor,
    action: wasFirstSchedule ? 'Scheduled' : 'Rescheduled',
    entityType: 'Pickup',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: pickup.status,
    newValue: 'Scheduled',
    ip: meta.ip,
  })

  const farmer = await farmerRepository.findById(pickup.farmerId.toString())
  pickupEvents.emit(PICKUP_EVENTS.SCHEDULED, {
    pickupId: id,
    pickupNumber: updated.pickupNumber,
    storageRequestId: pickup.storageRequestId.toString(),
    farmerId: pickup.farmerId.toString(),
    farmerUserId: farmer?.userId.toString() ?? '',
    scheduledDate: input.scheduledDate,
    scheduledBy: actor.id,
  })

  return toDto(updated)
}

async function start(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<PickupDto> {
  const pickup = await pickupRepository.findById(id)
  if (!pickup) throw ApiError.notFound('Pickup not found')
  assertTransitionAllowed(pickup.status, 'En Route')

  const updated = await pickupRepository.updateById(id, { status: 'En Route', updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Pickup not found')

  await auditService.record({
    actor,
    action: 'En Route',
    entityType: 'Pickup',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: pickup.status,
    newValue: 'En Route',
    ip: meta.ip,
  })

  return toDto(updated)
}

async function arrive(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<PickupDto> {
  const pickup = await pickupRepository.findById(id)
  if (!pickup) throw ApiError.notFound('Pickup not found')
  assertTransitionAllowed(pickup.status, 'Arrived')

  const updated = await pickupRepository.updateById(id, { status: 'Arrived', updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Pickup not found')

  await auditService.record({
    actor,
    action: 'Arrived',
    entityType: 'Pickup',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: pickup.status,
    newValue: 'Arrived',
    ip: meta.ip,
  })

  return toDto(updated)
}

async function collect(id: string, input: CollectPickupInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<PickupDto> {
  const pickup = await pickupRepository.findById(id)
  if (!pickup) throw ApiError.notFound('Pickup not found')
  assertTransitionAllowed(pickup.status, 'Collected')

  const collectedAt = new Date()
  const updated = await pickupRepository.updateById(id, {
    status: 'Collected',
    collectedQuantity: input.collectedQuantity,
    collectedWeightKg: input.collectedWeightKg,
    collectionGpsCoordinates: input.collectionGpsCoordinates ?? null,
    collectionPhotos: input.collectionPhotos,
    collectionNotes: input.collectionNotes ?? null,
    collectedBy: toObjectId(actor.id),
    collectedAt,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Pickup not found')

  await auditService.record({
    actor,
    action: 'Collected',
    entityType: 'Pickup',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: pickup.status,
    newValue: 'Collected',
    ip: meta.ip,
  })

  const farmer = await farmerRepository.findById(pickup.farmerId.toString())
  pickupEvents.emit(PICKUP_EVENTS.COLLECTED, {
    pickupId: id,
    pickupNumber: updated.pickupNumber,
    storageRequestId: pickup.storageRequestId.toString(),
    farmerId: pickup.farmerId.toString(),
    farmerUserId: farmer?.userId.toString() ?? '',
    collectedQuantity: input.collectedQuantity,
    collectedWeightKg: input.collectedWeightKg,
    collectedBy: actor.id,
    collectedAt,
  })

  return toDto(updated)
}

async function complete(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<PickupDto> {
  const pickup = await pickupRepository.findById(id)
  if (!pickup) throw ApiError.notFound('Pickup not found')
  assertTransitionAllowed(pickup.status, 'Completed')

  const completedAt = new Date()
  const updated = await pickupRepository.updateById(id, {
    status: 'Completed',
    completedBy: toObjectId(actor.id),
    completedAt,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Pickup not found')

  await storageRequestRepository.updateById(pickup.storageRequestId.toString(), { status: 'Completed' })

  await auditService.record({
    actor,
    action: 'Completed',
    entityType: 'Pickup',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: pickup.status,
    newValue: 'Completed',
    ip: meta.ip,
  })

  const farmer = await farmerRepository.findById(pickup.farmerId.toString())
  pickupEvents.emit(PICKUP_EVENTS.COMPLETED, {
    pickupId: id,
    pickupNumber: updated.pickupNumber,
    storageRequestId: pickup.storageRequestId.toString(),
    farmerId: pickup.farmerId.toString(),
    farmerUserId: farmer?.userId.toString() ?? '',
    completedBy: actor.id,
    completedAt,
  })

  return toDto(updated)
}

async function cancel(id: string, input: CancelPickupInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<PickupDto> {
  const pickup = await pickupRepository.findById(id)
  if (!pickup) throw ApiError.notFound('Pickup not found')

  if (!CANCELLABLE_STATUSES.includes(pickup.status)) {
    throw ApiError.conflict(`Cannot cancel a pickup in "${pickup.status}" status`)
  }

  const previousStatus = pickup.status
  const cancelledAt = new Date()
  const updated = await pickupRepository.updateById(id, {
    status: 'Cancelled',
    cancelledBy: toObjectId(actor.id),
    cancelledAt,
    cancellationReason: input.reason,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Pickup not found')

  // A pickup that had already advanced the Storage Request to "Pickup
  // Scheduled" leaves it there on cancellation — revert to "Approved" so
  // the request isn't left pointing at a dead pickup. (Re-scheduling a
  // fresh Pickup after this point has no dedicated endpoint yet; that's a
  // natural follow-up, not something this phase's spec calls for.)
  if (previousStatus !== 'Pending') {
    await storageRequestRepository.updateById(pickup.storageRequestId.toString(), { status: 'Approved' })
  }

  await auditService.record({
    actor,
    action: 'Cancelled',
    entityType: 'Pickup',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousStatus,
    newValue: `Cancelled — ${input.reason}`,
    ip: meta.ip,
  })

  const farmer = await farmerRepository.findById(pickup.farmerId.toString())
  pickupEvents.emit(PICKUP_EVENTS.CANCELLED, {
    pickupId: id,
    pickupNumber: updated.pickupNumber,
    storageRequestId: pickup.storageRequestId.toString(),
    farmerId: pickup.farmerId.toString(),
    farmerUserId: farmer?.userId.toString() ?? '',
    cancelledBy: actor.id,
    cancelledAt,
    reason: input.reason,
  })

  return toDto(updated)
}

async function updateRouteNotes(id: string, input: UpdateRouteNotesInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<PickupDto> {
  const pickup = await pickupRepository.findById(id)
  if (!pickup) throw ApiError.notFound('Pickup not found')

  const previousNotes = pickup.routeNotes
  const updated = await pickupRepository.updateById(id, { routeNotes: input.routeNotes, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Pickup not found')

  await auditService.record({
    actor,
    action: 'Route Notes Updated',
    entityType: 'Pickup',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousNotes,
    newValue: input.routeNotes,
    ip: meta.ip,
  })

  return toDto(updated)
}

export const pickupService = {
  createFromApprovedStorageRequest,
  getById,
  list,
  schedule,
  start,
  arrive,
  collect,
  complete,
  cancel,
  updateRouteNotes,
}
