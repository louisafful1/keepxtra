import { inventoryRepository } from '../repositories/inventory.repository'
import { inventoryMovementRepository } from '../repositories/inventoryMovement.repository'
import { pickupRepository } from '../repositories/pickup.repository'
import { storageRequestRepository } from '../repositories/storageRequest.repository'
import { farmerRepository } from '../repositories/farmer.repository'
import { warehouseRepository } from '../repositories/warehouse.repository'
import { coldRoomRepository } from '../repositories/coldRoom.repository'
import { auditService } from './audit.service'
import { getNextSequenceValue } from '../utils/counter'
import { toObjectId } from '../utils/mongoose'
import { loadActor } from '../utils/systemActor'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import { INVENTORY_EVENTS, inventoryEvents } from '../events/inventory.events'
import type { QueryFilter } from 'mongoose'
import type { IInventory, InventoryStatus } from '../models/inventory.model'
import type { IInventoryMovement } from '../models/inventoryMovement.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { InventoryDto, InventoryIntelligenceSummaryDto, InventoryMovementDto } from '../types/inventory.dto'
import type { PickupCompletedEvent } from '../events/pickup.events'
import type {
  AdjustInventoryInput,
  DisposeInventoryInput,
  InventoryListQuery,
  MovementListQuery,
  ReceiveInventoryInput,
  TransferInventoryInput,
} from '../validators/inventory.validators'

export interface RequestMeta {
  ip?: string | null
}

/** Relative-to-original-lot signal, not an absolute reorder point — there's no per-produce-type catalog to configure one against. */
const LOW_STOCK_RATIO = 0.2
const NEAR_EXPIRY_THRESHOLD_DAYS = 3
const DAY_MS = 24 * 60 * 60 * 1000
/** Applied to Warehouse/ColdRoom occupancy — "overstock" is a storage-location concern, not a per-item one. */
const OVERSTOCK_UTILIZATION_THRESHOLD_PERCENT = 90

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function describe(inventory: Pick<IInventory, 'inventoryCode' | 'produceType'>): string {
  return `${inventory.inventoryCode} (${inventory.produceType})`
}

function toDto(inventory: IInventory): InventoryDto {
  const now = new Date()
  const isExpired = inventory.expiryDate !== null && inventory.expiryDate < now
  const isNearExpiry =
    inventory.expiryDate !== null && !isExpired && inventory.expiryDate.getTime() <= now.getTime() + NEAR_EXPIRY_THRESHOLD_DAYS * DAY_MS
  const isLowStock = inventory.currentQuantity > 0 && inventory.currentQuantity <= inventory.initialQuantity * LOW_STOCK_RATIO

  return {
    id: inventory._id.toString(),
    inventoryCode: inventory.inventoryCode,
    pickupId: inventory.pickupId.toString(),
    storageRequestId: inventory.storageRequestId.toString(),
    requestNumber: inventory.requestNumber,
    farmerId: inventory.farmerId.toString(),
    farmerName: inventory.farmerName,
    farmerNumber: inventory.farmerNumber,

    produceType: inventory.produceType,
    unit: inventory.unit,
    harvestDate: inventory.harvestDate,

    initialQuantity: inventory.initialQuantity,
    currentQuantity: inventory.currentQuantity,
    reservedQuantity: inventory.reservedQuantity,
    availableQuantity: inventory.currentQuantity - inventory.reservedQuantity,

    warehouseId: inventory.warehouseId?.toString() ?? null,
    warehouseCode: inventory.warehouseCode,
    warehouseName: inventory.warehouseName,
    coldRoomId: inventory.coldRoomId?.toString() ?? null,
    coldRoomCode: inventory.coldRoomCode,

    shelfLifeDays: inventory.shelfLifeDays,
    expiryDate: inventory.expiryDate,
    valuePerUnit: inventory.valuePerUnit,
    totalValue: inventory.valuePerUnit !== null ? round2(inventory.currentQuantity * inventory.valuePerUnit) : null,

    status: inventory.status,
    receivedAt: inventory.receivedAt,
    receivedBy: inventory.receivedBy?.toString() ?? null,
    disposedAt: inventory.disposedAt,
    disposedBy: inventory.disposedBy?.toString() ?? null,
    disposalReason: inventory.disposalReason,

    isExpired,
    isNearExpiry,
    isLowStock,

    createdAt: inventory.createdAt,
    updatedAt: inventory.updatedAt,
  }
}

function toMovementDto(movement: IInventoryMovement): InventoryMovementDto {
  return {
    id: movement._id.toString(),
    inventoryId: movement.inventoryId.toString(),
    type: movement.type,
    quantityChange: movement.quantityChange,
    quantityBefore: movement.quantityBefore,
    quantityAfter: movement.quantityAfter,
    reason: movement.reason,
    fromWarehouseId: movement.fromWarehouseId?.toString() ?? null,
    toWarehouseId: movement.toWarehouseId?.toString() ?? null,
    performedBy: movement.performedBy.toString(),
    createdAt: movement.createdAt,
  }
}

/**
 * The event-driven automation fulfilled at the Inventory layer: subscribed
 * by `inventoryAutoCreate.listener.ts` to `PICKUP_EVENTS.COMPLETED`. Not
 * exposed over HTTP — an Inventory record only ever comes into existence
 * this way.
 */
async function createFromCompletedPickup(event: PickupCompletedEvent): Promise<InventoryDto> {
  const existing = await inventoryRepository.findByPickupId(event.pickupId)
  if (existing) return toDto(existing)

  const pickup = await pickupRepository.findById(event.pickupId)
  if (!pickup) throw ApiError.notFound('Pickup not found')

  const storageRequest = await storageRequestRepository.findById(pickup.storageRequestId.toString())
  if (!storageRequest) throw ApiError.notFound('Storage request not found')

  const actor = await loadActor(event.completedBy)
  const inventoryCode = `INV-${String(await getNextSequenceValue('inventory')).padStart(5, '0')}`

  // `collect()` is the only path into `Collected`, and it always sets
  // `collectedQuantity` — by the time a pickup reaches `Completed` (only
  // reachable from `Collected`), this is guaranteed non-null.
  const quantity = pickup.collectedQuantity as number

  const inventory = await inventoryRepository.create({
    inventoryCode,
    pickupId: pickup._id,
    storageRequestId: pickup.storageRequestId,
    requestNumber: pickup.requestNumber,
    farmerId: pickup.farmerId,
    farmerName: pickup.farmerName,
    farmerNumber: pickup.farmerNumber,
    produceType: pickup.produceType,
    unit: pickup.unit,
    harvestDate: storageRequest.harvestDate,
    initialQuantity: quantity,
    currentQuantity: quantity,
    createdBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Inventory Auto-Created',
    entityType: 'Inventory',
    entityId: inventory._id.toString(),
    affectedRecord: describe(inventory),
    newValue: 'Pending Placement',
    ip: null,
  })

  return toDto(inventory)
}

async function getById(id: string): Promise<InventoryDto> {
  const inventory = await inventoryRepository.findById(id)
  if (!inventory) throw ApiError.notFound('Inventory record not found')
  return toDto(inventory)
}

async function list(query: InventoryListQuery): Promise<{ data: InventoryDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)
  const baseFilter = buildFilterQuery<IInventory>({
    search: query,
    searchableFields: ['inventoryCode', 'requestNumber', 'farmerName', 'farmerNumber', 'produceType', 'warehouseCode', 'warehouseName'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status, produceType: query.produceType, warehouseId: query.warehouseId },
  })

  const and: QueryFilter<IInventory>[] = [baseFilter]
  const now = new Date()

  if (query.expired) {
    and.push({ expiryDate: { $ne: null, $lt: now } })
  }
  if (query.nearExpiry) {
    const threshold = new Date(now.getTime() + NEAR_EXPIRY_THRESHOLD_DAYS * DAY_MS)
    and.push({ expiryDate: { $ne: null, $gte: now, $lte: threshold } })
  }
  if (query.lowStock) {
    and.push({
      $expr: {
        $and: [{ $gt: ['$currentQuantity', 0] }, { $lte: ['$currentQuantity', { $multiply: ['$initialQuantity', LOW_STOCK_RATIO] }] }],
      },
    })
  }

  const filter: QueryFilter<IInventory> = and.length === 1 ? and[0]! : { $and: and }
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    inventoryRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    inventoryRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function getMovements(id: string, query: MovementListQuery): Promise<{ data: InventoryMovementDto[]; meta: PaginationMeta }> {
  const inventory = await inventoryRepository.findById(id)
  if (!inventory) throw ApiError.notFound('Inventory record not found')

  const pagination = resolvePagination(query)
  const [records, total] = await Promise.all([
    inventoryMovementRepository.findByInventoryId(id, { skip: pagination.skip, limit: pagination.limit }),
    inventoryMovementRepository.countByInventoryId(id),
  ])

  return { data: records.map(toMovementDto), meta: buildPaginationMeta(total, pagination) }
}

async function receive(id: string, input: ReceiveInventoryInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<InventoryDto> {
  const inventory = await inventoryRepository.findById(id)
  if (!inventory) throw ApiError.notFound('Inventory record not found')
  if (inventory.status !== 'Pending Placement') throw ApiError.conflict(`Cannot receive inventory in "${inventory.status}" status`)

  const warehouse = await warehouseRepository.findById(input.warehouseId)
  if (!warehouse) throw ApiError.notFound('Warehouse not found')

  const coldRoom = input.coldRoomId ? await coldRoomRepository.findById(input.coldRoomId) : null
  if (input.coldRoomId && !coldRoom) throw ApiError.notFound('Cold room not found')
  if (coldRoom && coldRoom.warehouseId.toString() !== warehouse._id.toString()) {
    throw ApiError.badRequest('The cold room does not belong to the given warehouse')
  }

  const receivedAt = new Date()
  const expiryDate = new Date(inventory.harvestDate.getTime() + input.shelfLifeDays * DAY_MS)

  const updated = await inventoryRepository.updateById(id, {
    status: 'In Stock',
    warehouseId: warehouse._id,
    warehouseCode: warehouse.warehouseCode,
    warehouseName: warehouse.name,
    coldRoomId: coldRoom?._id ?? null,
    coldRoomCode: coldRoom?.coldRoomCode ?? null,
    shelfLifeDays: input.shelfLifeDays,
    expiryDate,
    valuePerUnit: input.valuePerUnit ?? null,
    receivedAt,
    receivedBy: toObjectId(actor.id),
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Inventory record not found')

  await inventoryMovementRepository.create({
    inventoryId: updated._id,
    type: 'Receipt',
    quantityChange: updated.currentQuantity,
    quantityBefore: 0,
    quantityAfter: updated.currentQuantity,
    fromWarehouseId: null,
    toWarehouseId: warehouse._id,
    performedBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Inventory Received',
    entityType: 'Inventory',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: 'Pending Placement',
    newValue: 'In Stock',
    ip: meta.ip,
  })

  const farmer = await farmerRepository.findById(updated.farmerId.toString())
  inventoryEvents.emit(INVENTORY_EVENTS.RECEIVED, {
    inventoryId: id,
    inventoryCode: updated.inventoryCode,
    farmerId: updated.farmerId.toString(),
    farmerUserId: farmer?.userId.toString() ?? '',
    produceType: updated.produceType,
    warehouseId: warehouse._id.toString(),
    coldRoomId: coldRoom?._id.toString() ?? null,
    receivedBy: actor.id,
    receivedAt,
  })

  return toDto(updated)
}

async function adjust(id: string, input: AdjustInventoryInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<InventoryDto> {
  const inventory = await inventoryRepository.findById(id)
  if (!inventory) throw ApiError.notFound('Inventory record not found')
  if (inventory.status !== 'In Stock') throw ApiError.conflict(`Cannot adjust inventory in "${inventory.status}" status`)

  const quantityBefore = inventory.currentQuantity
  const quantityAfter = quantityBefore + input.quantityChange
  if (quantityAfter < 0) throw ApiError.conflict('Adjustment would result in negative stock')
  if (quantityAfter < inventory.reservedQuantity) throw ApiError.conflict('Adjustment would drop stock below the reserved quantity')

  const newStatus: InventoryStatus = quantityAfter === 0 ? 'Depleted' : 'In Stock'
  const updated = await inventoryRepository.updateById(id, {
    currentQuantity: quantityAfter,
    status: newStatus,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Inventory record not found')

  await inventoryMovementRepository.create({
    inventoryId: updated._id,
    type: 'Adjustment',
    quantityChange: input.quantityChange,
    quantityBefore,
    quantityAfter,
    reason: input.reason,
    fromWarehouseId: null,
    toWarehouseId: null,
    performedBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Inventory Adjusted',
    entityType: 'Inventory',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: String(quantityBefore),
    newValue: `${String(quantityAfter)} (${input.reason})`,
    ip: meta.ip,
  })

  return toDto(updated)
}

async function transfer(id: string, input: TransferInventoryInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<InventoryDto> {
  const inventory = await inventoryRepository.findById(id)
  if (!inventory) throw ApiError.notFound('Inventory record not found')
  if (inventory.status !== 'In Stock') throw ApiError.conflict(`Cannot transfer inventory in "${inventory.status}" status`)

  const warehouse = await warehouseRepository.findById(input.warehouseId)
  if (!warehouse) throw ApiError.notFound('Warehouse not found')

  const coldRoom = input.coldRoomId ? await coldRoomRepository.findById(input.coldRoomId) : null
  if (input.coldRoomId && !coldRoom) throw ApiError.notFound('Cold room not found')
  if (coldRoom && coldRoom.warehouseId.toString() !== warehouse._id.toString()) {
    throw ApiError.badRequest('The cold room does not belong to the given warehouse')
  }

  const previousWarehouseId = inventory.warehouseId

  const updated = await inventoryRepository.updateById(id, {
    warehouseId: warehouse._id,
    warehouseCode: warehouse.warehouseCode,
    warehouseName: warehouse.name,
    coldRoomId: coldRoom?._id ?? null,
    coldRoomCode: coldRoom?.coldRoomCode ?? null,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Inventory record not found')

  await inventoryMovementRepository.create({
    inventoryId: updated._id,
    type: 'Transfer',
    quantityChange: 0,
    quantityBefore: updated.currentQuantity,
    quantityAfter: updated.currentQuantity,
    fromWarehouseId: previousWarehouseId,
    toWarehouseId: warehouse._id,
    performedBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Inventory Transferred',
    entityType: 'Inventory',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousWarehouseId?.toString() ?? null,
    newValue: warehouse._id.toString(),
    ip: meta.ip,
  })

  return toDto(updated)
}

async function dispose(id: string, input: DisposeInventoryInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<InventoryDto> {
  const inventory = await inventoryRepository.findById(id)
  if (!inventory) throw ApiError.notFound('Inventory record not found')
  if (inventory.status !== 'In Stock') throw ApiError.conflict(`Cannot dispose inventory in "${inventory.status}" status`)

  const quantityBefore = inventory.currentQuantity
  const disposedAt = new Date()

  const updated = await inventoryRepository.updateById(id, {
    status: 'Disposed',
    currentQuantity: 0,
    disposedAt,
    disposedBy: toObjectId(actor.id),
    disposalReason: input.reason,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Inventory record not found')

  await inventoryMovementRepository.create({
    inventoryId: updated._id,
    type: 'Disposal',
    quantityChange: -quantityBefore,
    quantityBefore,
    quantityAfter: 0,
    reason: input.reason,
    fromWarehouseId: null,
    toWarehouseId: null,
    performedBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Inventory Disposed',
    entityType: 'Inventory',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: String(quantityBefore),
    newValue: `Disposed — ${input.reason}`,
    ip: meta.ip,
  })

  return toDto(updated)
}

async function getIntelligenceSummary(): Promise<InventoryIntelligenceSummaryDto> {
  const records = await inventoryRepository.findAllActive()
  const inStock = records.map(toDto).filter((d) => d.status === 'In Stock')

  const totalQuantity = inStock.reduce((sum, d) => sum + d.currentQuantity, 0)
  const totalValue = inStock.reduce((sum, d) => sum + (d.totalValue ?? 0), 0)

  const [warehouses, coldRooms] = await Promise.all([warehouseRepository.findAllActive(), coldRoomRepository.findAllActive()])
  const overstockedWarehouses = warehouses.filter(
    (w) => (w.currentOccupancyKg / w.totalCapacityKg) * 100 > OVERSTOCK_UTILIZATION_THRESHOLD_PERCENT,
  ).length
  const overstockedColdRooms = coldRooms.filter(
    (c) => (c.currentOccupancyKg / c.capacityKg) * 100 > OVERSTOCK_UTILIZATION_THRESHOLD_PERCENT,
  ).length

  return {
    totalItems: inStock.length,
    totalQuantity: round2(totalQuantity),
    totalValue: round2(totalValue),
    lowStockCount: inStock.filter((d) => d.isLowStock).length,
    nearExpiryCount: inStock.filter((d) => d.isNearExpiry).length,
    expiredCount: inStock.filter((d) => d.isExpired).length,
    overstockedWarehouses,
    overstockedColdRooms,
  }
}

export const inventoryService = {
  createFromCompletedPickup,
  getById,
  list,
  getMovements,
  receive,
  adjust,
  transfer,
  dispose,
  getIntelligenceSummary,
}
