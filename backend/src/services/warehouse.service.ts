import { warehouseRepository } from '../repositories/warehouse.repository'
import { auditService } from './audit.service'
import { getNextSequenceValue } from '../utils/counter'
import { toObjectId } from '../utils/mongoose'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import type { IWarehouse, IWarehouseZone, WarehouseStatus } from '../models/warehouse.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { WarehouseDto, WarehouseStatsDto, WarehouseStatsSummaryDto } from '../types/warehouse.dto'
import type {
  AdjustOccupancyInput,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  UpdateWarehouseStatusInput,
  WarehouseListQuery,
} from '../validators/warehouse.validators'

export interface RequestMeta {
  ip?: string | null
}

const WAREHOUSE_STATUSES: WarehouseStatus[] = ['Active', 'Inactive', 'Under Maintenance']

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function toDto(warehouse: IWarehouse): WarehouseDto {
  return {
    id: warehouse._id.toString(),
    warehouseCode: warehouse.warehouseCode,
    name: warehouse.name,
    location: warehouse.location,
    district: warehouse.district,
    region: warehouse.region,
    gpsCoordinates: warehouse.gpsCoordinates,
    totalCapacityKg: warehouse.totalCapacityKg,
    currentOccupancyKg: warehouse.currentOccupancyKg,
    zones: warehouse.zones.map((zone) => ({
      id: zone._id.toString(),
      name: zone.name,
      capacityKg: zone.capacityKg,
      currentOccupancyKg: zone.currentOccupancyKg,
    })),
    status: warehouse.status,
    notes: warehouse.notes,
    createdAt: warehouse.createdAt,
    updatedAt: warehouse.updatedAt,
  }
}

function describe(warehouse: Pick<IWarehouse, 'warehouseCode' | 'name'>): string {
  return `${warehouse.warehouseCode} (${warehouse.name})`
}

/** Zones can't collectively promise more space than the warehouse has, and no zone can be over-occupied. */
function assertCapacityInvariants(totalCapacityKg: number, zones: { capacityKg: number; currentOccupancyKg?: number | null }[]) {
  const zoneCapacitySum = zones.reduce((sum, zone) => sum + zone.capacityKg, 0)
  if (zoneCapacitySum > totalCapacityKg) {
    throw ApiError.conflict('The sum of zone capacities cannot exceed the warehouse total capacity')
  }
  for (const zone of zones) {
    if ((zone.currentOccupancyKg ?? 0) > zone.capacityKg) {
      throw ApiError.conflict('A zone cannot be occupied beyond its own capacity')
    }
  }
}

/**
 * Once a warehouse has zones, its top-level occupancy is always the *sum*
 * of its zones — never set directly (see `adjustOccupancy`). Dropping back
 * to zero zones preserves whatever occupancy total was last recorded
 * rather than resetting it, so a temporary "un-zone" edit can't silently
 * lose track of stock.
 */
function deriveOccupancy(zones: { currentOccupancyKg?: number | null }[], previousOccupancyKg: number): number {
  if (zones.length === 0) return previousOccupancyKg
  return zones.reduce((sum, zone) => sum + (zone.currentOccupancyKg ?? 0), 0)
}

async function create(input: CreateWarehouseInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<WarehouseDto> {
  assertCapacityInvariants(input.totalCapacityKg, input.zones)

  const warehouseCode = `WH-${String(await getNextSequenceValue('warehouse')).padStart(5, '0')}`

  const warehouse = await warehouseRepository.create({
    warehouseCode,
    name: input.name,
    location: input.location,
    district: input.district,
    region: input.region,
    gpsCoordinates: input.gpsCoordinates ?? null,
    totalCapacityKg: input.totalCapacityKg,
    currentOccupancyKg: deriveOccupancy(input.zones, 0),
    zones: input.zones as IWarehouseZone[],
    notes: input.notes ?? null,
    createdBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Warehouse Created',
    entityType: 'Warehouse',
    entityId: warehouse._id.toString(),
    affectedRecord: describe(warehouse),
    newValue: 'Active',
    ip: meta.ip,
  })

  return toDto(warehouse)
}

async function getById(id: string): Promise<WarehouseDto> {
  const warehouse = await warehouseRepository.findById(id)
  if (!warehouse) throw ApiError.notFound('Warehouse not found')
  return toDto(warehouse)
}

async function list(query: WarehouseListQuery): Promise<{ data: WarehouseDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)
  const filter = buildFilterQuery<IWarehouse>({
    search: query,
    searchableFields: ['warehouseCode', 'name', 'location', 'district', 'region'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status, region: query.region, district: query.district },
  })
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    warehouseRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    warehouseRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function update(id: string, input: UpdateWarehouseInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<WarehouseDto> {
  const warehouse = await warehouseRepository.findById(id)
  if (!warehouse) throw ApiError.notFound('Warehouse not found')

  const totalCapacityKg = input.totalCapacityKg ?? warehouse.totalCapacityKg
  const zones = input.zones ?? warehouse.zones
  assertCapacityInvariants(totalCapacityKg, zones)

  const { zones: zonesInput, ...rest } = input
  const payload: Partial<IWarehouse> = { ...rest, updatedBy: toObjectId(actor.id) }
  if (zonesInput) {
    payload.zones = zonesInput as IWarehouseZone[]
    payload.currentOccupancyKg = deriveOccupancy(zonesInput, warehouse.currentOccupancyKg)
  }

  const changedKeys = Object.keys(input) as (keyof IWarehouse)[]
  const before = warehouse as unknown as Record<string, unknown>

  const updated = await warehouseRepository.updateById(id, payload)
  if (!updated) throw ApiError.notFound('Warehouse not found')

  const after = updated as unknown as Record<string, unknown>
  await auditService.record({
    actor,
    action: 'Warehouse Updated',
    entityType: 'Warehouse',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, before[key]]))),
    newValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, after[key]]))),
    ip: meta.ip,
  })

  return toDto(updated)
}

async function updateStatus(id: string, input: UpdateWarehouseStatusInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<WarehouseDto> {
  const warehouse = await warehouseRepository.findById(id)
  if (!warehouse) throw ApiError.notFound('Warehouse not found')

  const previousStatus = warehouse.status
  const updated = await warehouseRepository.updateById(id, { status: input.status, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Warehouse not found')

  await auditService.record({
    actor,
    action: 'Warehouse Status Changed',
    entityType: 'Warehouse',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousStatus,
    newValue: input.status,
    ip: meta.ip,
  })

  return toDto(updated)
}

async function adjustOccupancy(id: string, input: AdjustOccupancyInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<WarehouseDto> {
  const warehouse = await warehouseRepository.findById(id)
  if (!warehouse) throw ApiError.notFound('Warehouse not found')

  let updated: IWarehouse | null

  if (warehouse.zones.length > 0) {
    if (!input.zoneId) throw ApiError.badRequest('zoneId is required — this warehouse tracks occupancy per zone')
    const zone = warehouse.zones.find((z) => z._id.toString() === input.zoneId)
    if (!zone) throw ApiError.notFound('Zone not found')
    if (input.occupancyKg > zone.capacityKg) throw ApiError.conflict('Occupancy cannot exceed the zone capacity')

    // Rebuilding each entry as an explicit plain object is required here —
    // spreading a Mongoose subdocument directly (`{ ...z }`) copies its
    // internal bookkeeping (`_doc`, `$__parent`, ...) as own properties
    // rather than the schema fields themselves, and casting that back into
    // the array silently resurrects the stale value from the nested `_doc`
    // instead of our override.
    const zones = warehouse.zones.map((z) => ({
      _id: z._id,
      name: z.name,
      capacityKg: z.capacityKg,
      currentOccupancyKg: z._id.toString() === input.zoneId ? input.occupancyKg : z.currentOccupancyKg,
    }))
    updated = await warehouseRepository.updateById(id, {
      zones,
      currentOccupancyKg: deriveOccupancy(zones, warehouse.currentOccupancyKg),
      updatedBy: toObjectId(actor.id),
    })
  } else {
    if (input.zoneId) throw ApiError.badRequest('This warehouse has no zones — omit zoneId and adjust total occupancy directly')
    if (input.occupancyKg > warehouse.totalCapacityKg) throw ApiError.conflict('Occupancy cannot exceed the total capacity')

    updated = await warehouseRepository.updateById(id, { currentOccupancyKg: input.occupancyKg, updatedBy: toObjectId(actor.id) })
  }
  if (!updated) throw ApiError.notFound('Warehouse not found')

  await auditService.record({
    actor,
    action: 'Warehouse Occupancy Adjusted',
    entityType: 'Warehouse',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: String(warehouse.currentOccupancyKg),
    newValue: String(updated.currentOccupancyKg),
    ip: meta.ip,
  })

  return toDto(updated)
}

async function softDelete(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<void> {
  const warehouse = await warehouseRepository.findById(id)
  if (!warehouse) throw ApiError.notFound('Warehouse not found')

  if (warehouse.currentOccupancyKg > 0) {
    throw ApiError.conflict('Cannot delete a warehouse that has recorded occupancy')
  }

  const deleted = await warehouseRepository.softDeleteById(id)
  if (!deleted) throw ApiError.notFound('Warehouse not found')

  await auditService.record({
    actor,
    action: 'Warehouse Deleted',
    entityType: 'Warehouse',
    entityId: id,
    affectedRecord: describe(warehouse),
    previousValue: 'Active record',
    newValue: 'Soft-deleted',
    ip: meta.ip,
  })
}

async function restore(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<WarehouseDto> {
  const warehouse = await warehouseRepository.findDeletedById(id)
  if (!warehouse) throw ApiError.notFound('No deleted warehouse found with this id')

  const restored = await warehouseRepository.restoreById(id)
  if (!restored) throw ApiError.notFound('Warehouse not found')

  await auditService.record({
    actor,
    action: 'Warehouse Restored',
    entityType: 'Warehouse',
    entityId: id,
    affectedRecord: describe(restored),
    previousValue: 'Soft-deleted',
    newValue: 'Active record',
    ip: meta.ip,
  })

  return toDto(restored)
}

async function getStats(id: string): Promise<WarehouseStatsDto> {
  const warehouse = await warehouseRepository.findById(id)
  if (!warehouse) throw ApiError.notFound('Warehouse not found')

  return {
    warehouseId: warehouse._id.toString(),
    warehouseCode: warehouse.warehouseCode,
    totalCapacityKg: warehouse.totalCapacityKg,
    currentOccupancyKg: warehouse.currentOccupancyKg,
    availableCapacityKg: warehouse.totalCapacityKg - warehouse.currentOccupancyKg,
    utilizationPercent: round2((warehouse.currentOccupancyKg / warehouse.totalCapacityKg) * 100),
    zones: warehouse.zones.map((zone) => ({
      id: zone._id.toString(),
      name: zone.name,
      capacityKg: zone.capacityKg,
      currentOccupancyKg: zone.currentOccupancyKg,
      availableCapacityKg: zone.capacityKg - zone.currentOccupancyKg,
      utilizationPercent: round2((zone.currentOccupancyKg / zone.capacityKg) * 100),
    })),
  }
}

async function getStatsSummary(): Promise<WarehouseStatsSummaryDto> {
  const warehouses = await warehouseRepository.findAllActive()

  const totalCapacityKg = warehouses.reduce((sum, w) => sum + w.totalCapacityKg, 0)
  const totalOccupancyKg = warehouses.reduce((sum, w) => sum + w.currentOccupancyKg, 0)

  const byStatus = WAREHOUSE_STATUSES.reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    {} as Record<WarehouseStatus, number>,
  )
  for (const warehouse of warehouses) byStatus[warehouse.status] += 1

  return {
    warehouseCount: warehouses.length,
    totalCapacityKg,
    totalOccupancyKg,
    availableCapacityKg: totalCapacityKg - totalOccupancyKg,
    utilizationPercent: totalCapacityKg > 0 ? round2((totalOccupancyKg / totalCapacityKg) * 100) : 0,
    byStatus,
  }
}

export const warehouseService = {
  create,
  getById,
  list,
  update,
  updateStatus,
  adjustOccupancy,
  softDelete,
  restore,
  getStats,
  getStatsSummary,
}
