import { coldRoomRepository } from '../repositories/coldRoom.repository'
import { warehouseRepository } from '../repositories/warehouse.repository'
import { auditService } from './audit.service'
import { getNextSequenceValue } from '../utils/counter'
import { toObjectId } from '../utils/mongoose'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import type { IColdRoom, ColdRoomStatus } from '../models/coldRoom.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { ColdRoomDto, ColdRoomStatsSummaryDto } from '../types/coldRoom.dto'
import type {
  AdjustOccupancyInput,
  ColdRoomListQuery,
  CreateColdRoomInput,
  RecordReadingInput,
  UpdateColdRoomInput,
  UpdateColdRoomStatusInput,
} from '../validators/coldRoom.validators'

export interface RequestMeta {
  ip?: string | null
}

const COLD_ROOM_STATUSES: ColdRoomStatus[] = ['Active', 'Inactive', 'Under Maintenance']

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Computed, never stored — always reflects the latest reading against the room's current target range. */
function computeAlerts(coldRoom: Pick<IColdRoom, 'currentTemperatureC' | 'targetTemperatureMinC' | 'targetTemperatureMaxC' | 'currentHumidityPercent' | 'targetHumidityMinPercent' | 'targetHumidityMaxPercent'>): string[] {
  const alerts: string[] = []

  if (coldRoom.currentTemperatureC !== null) {
    if (coldRoom.currentTemperatureC < coldRoom.targetTemperatureMinC || coldRoom.currentTemperatureC > coldRoom.targetTemperatureMaxC) {
      alerts.push(
        `Temperature ${coldRoom.currentTemperatureC}°C is outside the target range (${coldRoom.targetTemperatureMinC}–${coldRoom.targetTemperatureMaxC}°C)`,
      )
    }
  }

  if (coldRoom.currentHumidityPercent !== null) {
    if (coldRoom.currentHumidityPercent < coldRoom.targetHumidityMinPercent || coldRoom.currentHumidityPercent > coldRoom.targetHumidityMaxPercent) {
      alerts.push(
        `Humidity ${coldRoom.currentHumidityPercent}% is outside the target range (${coldRoom.targetHumidityMinPercent}–${coldRoom.targetHumidityMaxPercent}%)`,
      )
    }
  }

  return alerts
}

function toDto(coldRoom: IColdRoom): ColdRoomDto {
  const alerts = computeAlerts(coldRoom)
  return {
    id: coldRoom._id.toString(),
    coldRoomCode: coldRoom.coldRoomCode,
    warehouseId: coldRoom.warehouseId.toString(),
    warehouseCode: coldRoom.warehouseCode,
    warehouseName: coldRoom.warehouseName,

    name: coldRoom.name,
    capacityKg: coldRoom.capacityKg,
    currentOccupancyKg: coldRoom.currentOccupancyKg,
    availableCapacityKg: coldRoom.capacityKg - coldRoom.currentOccupancyKg,
    utilizationPercent: round2((coldRoom.currentOccupancyKg / coldRoom.capacityKg) * 100),

    targetTemperatureMinC: coldRoom.targetTemperatureMinC,
    targetTemperatureMaxC: coldRoom.targetTemperatureMaxC,
    currentTemperatureC: coldRoom.currentTemperatureC,

    targetHumidityMinPercent: coldRoom.targetHumidityMinPercent,
    targetHumidityMaxPercent: coldRoom.targetHumidityMaxPercent,
    currentHumidityPercent: coldRoom.currentHumidityPercent,

    lastReadingAt: coldRoom.lastReadingAt,
    status: coldRoom.status,
    isAvailable: coldRoom.status === 'Active' && coldRoom.currentOccupancyKg < coldRoom.capacityKg,
    alerts,
    notes: coldRoom.notes,

    createdAt: coldRoom.createdAt,
    updatedAt: coldRoom.updatedAt,
  }
}

function describe(coldRoom: Pick<IColdRoom, 'coldRoomCode' | 'name'>): string {
  return `${coldRoom.coldRoomCode} (${coldRoom.name})`
}

async function create(input: CreateColdRoomInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<ColdRoomDto> {
  const warehouse = await warehouseRepository.findById(input.warehouseId)
  if (!warehouse) throw ApiError.notFound('Warehouse not found')

  const coldRoomCode = `CR-${String(await getNextSequenceValue('cold-room')).padStart(5, '0')}`

  const coldRoom = await coldRoomRepository.create({
    coldRoomCode,
    warehouseId: warehouse._id,
    warehouseCode: warehouse.warehouseCode,
    warehouseName: warehouse.name,
    name: input.name,
    capacityKg: input.capacityKg,
    targetTemperatureMinC: input.targetTemperatureMinC,
    targetTemperatureMaxC: input.targetTemperatureMaxC,
    targetHumidityMinPercent: input.targetHumidityMinPercent,
    targetHumidityMaxPercent: input.targetHumidityMaxPercent,
    notes: input.notes ?? null,
    createdBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Cold Room Created',
    entityType: 'ColdRoom',
    entityId: coldRoom._id.toString(),
    affectedRecord: describe(coldRoom),
    newValue: 'Active',
    ip: meta.ip,
  })

  return toDto(coldRoom)
}

async function getById(id: string): Promise<ColdRoomDto> {
  const coldRoom = await coldRoomRepository.findById(id)
  if (!coldRoom) throw ApiError.notFound('Cold room not found')
  return toDto(coldRoom)
}

async function list(query: ColdRoomListQuery): Promise<{ data: ColdRoomDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)
  const filter = buildFilterQuery<IColdRoom>({
    search: query,
    searchableFields: ['coldRoomCode', 'name', 'warehouseCode', 'warehouseName'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status, warehouseId: query.warehouseId },
  })
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    coldRoomRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    coldRoomRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function update(id: string, input: UpdateColdRoomInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<ColdRoomDto> {
  const coldRoom = await coldRoomRepository.findById(id)
  if (!coldRoom) throw ApiError.notFound('Cold room not found')

  const capacityKg = input.capacityKg ?? coldRoom.capacityKg
  if (coldRoom.currentOccupancyKg > capacityKg) {
    throw ApiError.conflict('The new capacity is below the currently recorded occupancy')
  }

  const tempMin = input.targetTemperatureMinC ?? coldRoom.targetTemperatureMinC
  const tempMax = input.targetTemperatureMaxC ?? coldRoom.targetTemperatureMaxC
  if (tempMin > tempMax) throw ApiError.conflict('targetTemperatureMaxC cannot be below targetTemperatureMinC')

  const humidityMin = input.targetHumidityMinPercent ?? coldRoom.targetHumidityMinPercent
  const humidityMax = input.targetHumidityMaxPercent ?? coldRoom.targetHumidityMaxPercent
  if (humidityMin > humidityMax) throw ApiError.conflict('targetHumidityMaxPercent cannot be below targetHumidityMinPercent')

  const changedKeys = Object.keys(input) as (keyof IColdRoom)[]
  const before = coldRoom as unknown as Record<string, unknown>

  const updated = await coldRoomRepository.updateById(id, { ...input, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Cold room not found')

  const after = updated as unknown as Record<string, unknown>
  await auditService.record({
    actor,
    action: 'Cold Room Updated',
    entityType: 'ColdRoom',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, before[key]]))),
    newValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, after[key]]))),
    ip: meta.ip,
  })

  return toDto(updated)
}

async function updateStatus(id: string, input: UpdateColdRoomStatusInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<ColdRoomDto> {
  const coldRoom = await coldRoomRepository.findById(id)
  if (!coldRoom) throw ApiError.notFound('Cold room not found')

  const previousStatus = coldRoom.status
  const updated = await coldRoomRepository.updateById(id, { status: input.status, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Cold room not found')

  await auditService.record({
    actor,
    action: 'Cold Room Status Changed',
    entityType: 'ColdRoom',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousStatus,
    newValue: input.status,
    ip: meta.ip,
  })

  return toDto(updated)
}

async function recordReading(id: string, input: RecordReadingInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<ColdRoomDto> {
  const coldRoom = await coldRoomRepository.findById(id)
  if (!coldRoom) throw ApiError.notFound('Cold room not found')

  const payload: Partial<IColdRoom> = { lastReadingAt: new Date(), updatedBy: toObjectId(actor.id) }
  if (input.temperatureC !== undefined) payload.currentTemperatureC = input.temperatureC
  if (input.humidityPercent !== undefined) payload.currentHumidityPercent = input.humidityPercent

  const updated = await coldRoomRepository.updateById(id, payload)
  if (!updated) throw ApiError.notFound('Cold room not found')

  const alerts = computeAlerts(updated)
  await auditService.record({
    actor,
    action: alerts.length > 0 ? 'Reading Recorded — Alert' : 'Reading Recorded',
    entityType: 'ColdRoom',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: null,
    newValue: alerts.length > 0 ? alerts.join('; ') : `${updated.currentTemperatureC ?? '—'}°C, ${updated.currentHumidityPercent ?? '—'}%`,
    ip: meta.ip,
  })

  return toDto(updated)
}

async function adjustOccupancy(id: string, input: AdjustOccupancyInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<ColdRoomDto> {
  const coldRoom = await coldRoomRepository.findById(id)
  if (!coldRoom) throw ApiError.notFound('Cold room not found')

  if (input.occupancyKg > coldRoom.capacityKg) throw ApiError.conflict('Occupancy cannot exceed the cold room capacity')

  const updated = await coldRoomRepository.updateById(id, { currentOccupancyKg: input.occupancyKg, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Cold room not found')

  await auditService.record({
    actor,
    action: 'Cold Room Occupancy Adjusted',
    entityType: 'ColdRoom',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: String(coldRoom.currentOccupancyKg),
    newValue: String(updated.currentOccupancyKg),
    ip: meta.ip,
  })

  return toDto(updated)
}

async function softDelete(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<void> {
  const coldRoom = await coldRoomRepository.findById(id)
  if (!coldRoom) throw ApiError.notFound('Cold room not found')

  if (coldRoom.currentOccupancyKg > 0) {
    throw ApiError.conflict('Cannot delete a cold room that has recorded occupancy')
  }

  const deleted = await coldRoomRepository.softDeleteById(id)
  if (!deleted) throw ApiError.notFound('Cold room not found')

  await auditService.record({
    actor,
    action: 'Cold Room Deleted',
    entityType: 'ColdRoom',
    entityId: id,
    affectedRecord: describe(coldRoom),
    previousValue: 'Active record',
    newValue: 'Soft-deleted',
    ip: meta.ip,
  })
}

async function restore(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<ColdRoomDto> {
  const coldRoom = await coldRoomRepository.findDeletedById(id)
  if (!coldRoom) throw ApiError.notFound('No deleted cold room found with this id')

  const restored = await coldRoomRepository.restoreById(id)
  if (!restored) throw ApiError.notFound('Cold room not found')

  await auditService.record({
    actor,
    action: 'Cold Room Restored',
    entityType: 'ColdRoom',
    entityId: id,
    affectedRecord: describe(restored),
    previousValue: 'Soft-deleted',
    newValue: 'Active record',
    ip: meta.ip,
  })

  return toDto(restored)
}

async function getStatsSummary(): Promise<ColdRoomStatsSummaryDto> {
  const coldRooms = await coldRoomRepository.findAllActive()

  const totalCapacityKg = coldRooms.reduce((sum, c) => sum + c.capacityKg, 0)
  const totalOccupancyKg = coldRooms.reduce((sum, c) => sum + c.currentOccupancyKg, 0)

  const byStatus = COLD_ROOM_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {} as Record<ColdRoomStatus, number>)
  let withActiveAlerts = 0
  for (const coldRoom of coldRooms) {
    byStatus[coldRoom.status] += 1
    if (computeAlerts(coldRoom).length > 0) withActiveAlerts += 1
  }

  return {
    coldRoomCount: coldRooms.length,
    totalCapacityKg,
    totalOccupancyKg,
    availableCapacityKg: totalCapacityKg - totalOccupancyKg,
    utilizationPercent: totalCapacityKg > 0 ? round2((totalOccupancyKg / totalCapacityKg) * 100) : 0,
    byStatus,
    withActiveAlerts,
  }
}

export const coldRoomService = {
  create,
  getById,
  list,
  update,
  updateStatus,
  recordReading,
  adjustOccupancy,
  softDelete,
  restore,
  getStatsSummary,
}
