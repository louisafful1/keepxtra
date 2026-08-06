import { orderRepository } from '../repositories/order.repository'
import { customerRepository } from '../repositories/customer.repository'
import { inventoryRepository } from '../repositories/inventory.repository'
import { inventoryMovementRepository } from '../repositories/inventoryMovement.repository'
import { auditService } from './audit.service'
import { getNextSequenceValue } from '../utils/counter'
import { toObjectId } from '../utils/mongoose'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import { ORDER_EVENTS, orderEvents, type OrderFarmerEarning } from '../events/order.events'
import type { IOrder, IOrderItem, OrderStatus } from '../models/order.model'
import type { IInventory } from '../models/inventory.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { OrderDto, SalesStatsSummaryDto } from '../types/order.dto'
import type { CancelOrderInput, CreateOrderInput, OrderListQuery, UpdateOrderInput } from '../validators/order.validators'

export interface RequestMeta {
  ip?: string | null
}

const ORDER_STATUSES: OrderStatus[] = ['Draft', 'Confirmed', 'Delivered', 'Cancelled']

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function describe(order: Pick<IOrder, 'orderNumber' | 'customerName'>): string {
  return `${order.orderNumber} (${order.customerName})`
}

function toDto(order: IOrder): OrderDto {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    invoiceNumber: order.invoiceNumber,
    customerId: order.customerId.toString(),
    customerName: order.customerName,
    items: order.items.map((item) => ({
      id: item._id.toString(),
      inventoryId: item.inventoryId.toString(),
      produceType: item.produceType,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotalAmount: item.subtotalAmount,
      farmerId: item.farmerId.toString(),
      costPerUnit: item.costPerUnit,
    })),

    subtotalAmount: order.subtotalAmount,
    totalAmount: order.totalAmount,
    farmerEarningsTotal: order.farmerEarningsTotal,
    profitAmount: order.profitAmount,

    status: order.status,
    deliveryAddress: order.deliveryAddress,
    deliveryDate: order.deliveryDate,

    confirmedAt: order.confirmedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    cancellationReason: order.cancellationReason,
    notes: order.notes,

    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

async function create(input: CreateOrderInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<OrderDto> {
  const customer = await customerRepository.findById(input.customerId)
  if (!customer) throw ApiError.notFound('Customer not found')

  const items: IOrderItem[] = []
  let subtotalAmount = 0
  let farmerEarningsTotal = 0

  for (const itemInput of input.items) {
    const inventory = await inventoryRepository.findById(itemInput.inventoryId)
    if (!inventory) throw ApiError.notFound(`Inventory record ${itemInput.inventoryId} not found`)
    if (inventory.status !== 'In Stock') throw ApiError.conflict(`${inventory.inventoryCode} is not In Stock`)
    if (inventory.valuePerUnit === null) throw ApiError.conflict(`${inventory.inventoryCode} has no recorded value — receive it with a valuePerUnit first`)

    const availableQuantity = inventory.currentQuantity - inventory.reservedQuantity
    if (itemInput.quantity > availableQuantity) {
      throw ApiError.conflict(`Insufficient available quantity for ${inventory.inventoryCode} (${availableQuantity} available)`)
    }

    const itemSubtotal = round2(itemInput.quantity * itemInput.unitPrice)
    subtotalAmount += itemSubtotal
    farmerEarningsTotal += round2(itemInput.quantity * inventory.valuePerUnit)

    items.push({
      inventoryId: inventory._id,
      produceType: inventory.produceType,
      quantity: itemInput.quantity,
      unitPrice: itemInput.unitPrice,
      subtotalAmount: itemSubtotal,
      farmerId: inventory.farmerId,
      costPerUnit: inventory.valuePerUnit,
    } as IOrderItem)
  }

  subtotalAmount = round2(subtotalAmount)
  farmerEarningsTotal = round2(farmerEarningsTotal)

  const orderNumber = `ORD-${String(await getNextSequenceValue('order')).padStart(5, '0')}`

  const order = await orderRepository.create({
    orderNumber,
    customerId: customer._id,
    customerName: customer.name,
    items,
    subtotalAmount,
    totalAmount: subtotalAmount,
    farmerEarningsTotal,
    profitAmount: round2(subtotalAmount - farmerEarningsTotal),
    deliveryAddress: input.deliveryAddress ?? null,
    deliveryDate: input.deliveryDate ?? null,
    notes: input.notes ?? null,
    createdBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Order Created',
    entityType: 'Order',
    entityId: order._id.toString(),
    affectedRecord: describe(order),
    newValue: 'Draft',
    ip: meta.ip,
  })

  return toDto(order)
}

async function getById(id: string): Promise<OrderDto> {
  const order = await orderRepository.findById(id)
  if (!order) throw ApiError.notFound('Order not found')
  return toDto(order)
}

async function list(query: OrderListQuery): Promise<{ data: OrderDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)
  const filter = buildFilterQuery<IOrder>({
    search: query,
    searchableFields: ['orderNumber', 'invoiceNumber', 'customerName'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status, customerId: query.customerId },
  })
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    orderRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    orderRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function update(id: string, input: UpdateOrderInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<OrderDto> {
  const order = await orderRepository.findById(id)
  if (!order) throw ApiError.notFound('Order not found')
  if (order.status !== 'Draft') throw ApiError.conflict(`Cannot edit an order in "${order.status}" status`)

  const changedKeys = Object.keys(input) as (keyof IOrder)[]
  const before = order as unknown as Record<string, unknown>

  const updated = await orderRepository.updateById(id, { ...input, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Order not found')

  const after = updated as unknown as Record<string, unknown>
  await auditService.record({
    actor,
    action: 'Order Updated',
    entityType: 'Order',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, before[key]]))),
    newValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, after[key]]))),
    ip: meta.ip,
  })

  return toDto(updated)
}

/**
 * Where stock actually leaves Inventory — a Draft order reserves nothing,
 * so availability is re-checked here (not just trusted from `create`)
 * before any deduction happens, and every item is validated before any is
 * deducted so a mid-order failure never leaves inventory half-adjusted.
 */
async function confirm(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<OrderDto> {
  const order = await orderRepository.findById(id)
  if (!order) throw ApiError.notFound('Order not found')
  if (order.status !== 'Draft') throw ApiError.conflict(`Cannot confirm an order in "${order.status}" status`)

  const inventories = new Map<string, IInventory>()
  for (const item of order.items) {
    const inventory = await inventoryRepository.findById(item.inventoryId.toString())
    if (!inventory || inventory.status !== 'In Stock') {
      throw ApiError.conflict(`${item.produceType} is no longer available`)
    }
    const availableQuantity = inventory.currentQuantity - inventory.reservedQuantity
    if (item.quantity > availableQuantity) {
      throw ApiError.conflict(`Insufficient available quantity for ${inventory.inventoryCode} (${availableQuantity} available)`)
    }
    inventories.set(item.inventoryId.toString(), inventory)
  }

  for (const item of order.items) {
    const inventory = inventories.get(item.inventoryId.toString())!
    const quantityBefore = inventory.currentQuantity
    const quantityAfter = quantityBefore - item.quantity
    await inventoryRepository.updateById(inventory._id.toString(), {
      currentQuantity: quantityAfter,
      status: quantityAfter === 0 ? 'Depleted' : 'In Stock',
      updatedBy: toObjectId(actor.id),
    })
    await inventoryMovementRepository.create({
      inventoryId: inventory._id,
      type: 'Adjustment',
      quantityChange: -item.quantity,
      quantityBefore,
      quantityAfter,
      reason: `Sold via Order ${order.orderNumber}`,
      fromWarehouseId: null,
      toWarehouseId: null,
      performedBy: toObjectId(actor.id),
    })
  }

  const invoiceNumber = `INV-${String(await getNextSequenceValue('invoice')).padStart(5, '0')}`
  const confirmedAt = new Date()
  const updated = await orderRepository.updateById(id, {
    status: 'Confirmed',
    invoiceNumber,
    confirmedAt,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Order not found')

  await auditService.record({
    actor,
    action: 'Order Confirmed',
    entityType: 'Order',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: 'Draft',
    newValue: `Confirmed — ${invoiceNumber}`,
    ip: meta.ip,
  })

  const earningsByFarmer = new Map<string, number>()
  for (const item of order.items) {
    const farmerId = item.farmerId.toString()
    earningsByFarmer.set(farmerId, round2((earningsByFarmer.get(farmerId) ?? 0) + item.quantity * item.costPerUnit))
  }
  const farmerEarnings: OrderFarmerEarning[] = Array.from(earningsByFarmer.entries()).map(([farmerId, amount]) => ({ farmerId, amount }))

  orderEvents.emit(ORDER_EVENTS.CONFIRMED, {
    orderId: id,
    orderNumber: updated.orderNumber,
    invoiceNumber,
    customerId: updated.customerId.toString(),
    totalAmount: updated.totalAmount,
    farmerEarnings,
    confirmedBy: actor.id,
    confirmedAt,
  })

  return toDto(updated)
}

async function deliver(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<OrderDto> {
  const order = await orderRepository.findById(id)
  if (!order) throw ApiError.notFound('Order not found')
  if (order.status !== 'Confirmed') throw ApiError.conflict(`Cannot deliver an order in "${order.status}" status`)

  const deliveredAt = new Date()
  const updated = await orderRepository.updateById(id, { status: 'Delivered', deliveredAt, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Order not found')

  await auditService.record({
    actor,
    action: 'Order Delivered',
    entityType: 'Order',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: 'Confirmed',
    newValue: 'Delivered',
    ip: meta.ip,
  })

  return toDto(updated)
}

async function cancel(id: string, input: CancelOrderInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<OrderDto> {
  const order = await orderRepository.findById(id)
  if (!order) throw ApiError.notFound('Order not found')
  if (order.status === 'Delivered' || order.status === 'Cancelled') {
    throw ApiError.conflict(`Cannot cancel an order in "${order.status}" status`)
  }

  const wasConfirmed = order.status === 'Confirmed'
  if (wasConfirmed) {
    for (const item of order.items) {
      const inventory = await inventoryRepository.findById(item.inventoryId.toString())
      if (!inventory || inventory.status === 'Disposed') continue

      const quantityBefore = inventory.currentQuantity
      const quantityAfter = quantityBefore + item.quantity
      await inventoryRepository.updateById(inventory._id.toString(), {
        currentQuantity: quantityAfter,
        status: 'In Stock',
        updatedBy: toObjectId(actor.id),
      })
      await inventoryMovementRepository.create({
        inventoryId: inventory._id,
        type: 'Adjustment',
        quantityChange: item.quantity,
        quantityBefore,
        quantityAfter,
        reason: `Order ${order.orderNumber} cancelled`,
        fromWarehouseId: null,
        toWarehouseId: null,
        performedBy: toObjectId(actor.id),
      })
    }
  }

  const cancelledAt = new Date()
  const updated = await orderRepository.updateById(id, {
    status: 'Cancelled',
    cancelledAt,
    cancellationReason: input.reason,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Order not found')

  await auditService.record({
    actor,
    action: 'Order Cancelled',
    entityType: 'Order',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: wasConfirmed ? 'Confirmed' : 'Draft',
    newValue: `Cancelled — ${input.reason}`,
    ip: meta.ip,
  })

  orderEvents.emit(ORDER_EVENTS.CANCELLED, {
    orderId: id,
    orderNumber: updated.orderNumber,
    wasConfirmed,
    cancelledBy: actor.id,
    cancelledAt,
    reason: input.reason,
  })

  return toDto(updated)
}

async function getStatsSummary(): Promise<SalesStatsSummaryDto> {
  const orders = await orderRepository.findAllActive()
  const revenueEligible = orders.filter((o) => o.status === 'Confirmed' || o.status === 'Delivered')

  const byStatus = ORDER_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {} as Record<OrderStatus, number>)
  for (const order of orders) byStatus[order.status] += 1

  return {
    orderCount: orders.length,
    byStatus,
    totalRevenue: round2(revenueEligible.reduce((sum, o) => sum + o.totalAmount, 0)),
    totalFarmerEarnings: round2(revenueEligible.reduce((sum, o) => sum + o.farmerEarningsTotal, 0)),
    totalProfit: round2(revenueEligible.reduce((sum, o) => sum + o.profitAmount, 0)),
  }
}

export const orderService = {
  create,
  getById,
  list,
  update,
  confirm,
  deliver,
  cancel,
  getStatsSummary,
}
