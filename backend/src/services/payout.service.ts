import { payoutRepository } from '../repositories/payout.repository'
import { orderRepository } from '../repositories/order.repository'
import { farmerRepository } from '../repositories/farmer.repository'
import { auditService } from './audit.service'
import { getNextSequenceValue } from '../utils/counter'
import { toObjectId } from '../utils/mongoose'
import { loadActor } from '../utils/systemActor'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import { PAYOUT_EVENTS, payoutEvents } from '../events/payout.events'
import type { IPayout, PayoutStatus } from '../models/payout.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { FarmerPayoutSummaryDto, PayoutDto, PayoutStatsSummaryDto } from '../types/payout.dto'
import type { OrderConfirmedEvent } from '../events/order.events'
import type { PayoutListQuery, ProcessPayoutInput, RejectPayoutInput } from '../validators/payout.validators'

export interface RequestMeta {
  ip?: string | null
}

const PAYOUT_STATUSES: PayoutStatus[] = ['Pending', 'Approved', 'Paid', 'Rejected']
const OUTSTANDING_STATUSES: PayoutStatus[] = ['Pending', 'Approved']

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function describe(payout: Pick<IPayout, 'payoutCode' | 'farmerName'>): string {
  return `${payout.payoutCode} (${payout.farmerName})`
}

function toDto(payout: IPayout): PayoutDto {
  return {
    id: payout._id.toString(),
    payoutCode: payout.payoutCode,
    farmerId: payout.farmerId.toString(),
    farmerName: payout.farmerName,
    farmerNumber: payout.farmerNumber,
    orderId: payout.orderId.toString(),
    orderNumber: payout.orderNumber,
    amount: payout.amount,

    status: payout.status,
    method: payout.method,
    transactionId: payout.transactionId,

    approvedBy: payout.approvedBy?.toString() ?? null,
    approvedAt: payout.approvedAt,
    processedBy: payout.processedBy?.toString() ?? null,
    processedAt: payout.processedAt,
    rejectedBy: payout.rejectedBy?.toString() ?? null,
    rejectedAt: payout.rejectedAt,
    rejectionReason: payout.rejectionReason,
    notes: payout.notes,

    createdAt: payout.createdAt,
    updatedAt: payout.updatedAt,
  }
}

/**
 * The extension point Module 7 promised: subscribed by
 * `payoutAutoCreate.listener.ts` to `ORDER_EVENTS.CONFIRMED`. One Payout
 * per farmer represented in the order. Not exposed over HTTP — a Payout
 * only ever comes into existence this way.
 */
async function createFromConfirmedOrder(event: OrderConfirmedEvent): Promise<PayoutDto[]> {
  const order = await orderRepository.findById(event.orderId)
  if (!order) throw ApiError.notFound('Order not found')

  const actor = await loadActor(event.confirmedBy)
  const created: PayoutDto[] = []

  for (const earning of event.farmerEarnings) {
    const existing = await payoutRepository.findByOrderAndFarmer(event.orderId, earning.farmerId)
    if (existing) {
      created.push(toDto(existing))
      continue
    }

    const farmer = await farmerRepository.findById(earning.farmerId)
    if (!farmer) continue

    const payoutCode = `PO-${String(await getNextSequenceValue('payout')).padStart(5, '0')}`
    const payout = await payoutRepository.create({
      payoutCode,
      farmerId: farmer._id,
      farmerName: `${farmer.firstName} ${farmer.lastName}`,
      farmerNumber: farmer.farmerNumber,
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: earning.amount,
      createdBy: toObjectId(actor.id),
    })

    await auditService.record({
      actor,
      action: 'Payout Auto-Created',
      entityType: 'Payout',
      entityId: payout._id.toString(),
      affectedRecord: describe(payout),
      newValue: 'Pending',
      ip: null,
    })

    created.push(toDto(payout))
  }

  return created
}

async function getById(id: string): Promise<PayoutDto> {
  const payout = await payoutRepository.findById(id)
  if (!payout) throw ApiError.notFound('Payout not found')
  return toDto(payout)
}

async function list(query: PayoutListQuery): Promise<{ data: PayoutDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)
  const filter = buildFilterQuery<IPayout>({
    search: query,
    searchableFields: ['payoutCode', 'farmerName', 'farmerNumber', 'orderNumber'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status, farmerId: query.farmerId, method: query.method },
  })
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    payoutRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    payoutRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function approve(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<PayoutDto> {
  const payout = await payoutRepository.findById(id)
  if (!payout) throw ApiError.notFound('Payout not found')
  if (payout.status !== 'Pending') throw ApiError.conflict(`Cannot approve a payout in "${payout.status}" status`)

  const approvedAt = new Date()
  const updated = await payoutRepository.updateById(id, { status: 'Approved', approvedBy: toObjectId(actor.id), approvedAt, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Payout not found')

  await auditService.record({
    actor,
    action: 'Payout Approved',
    entityType: 'Payout',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: 'Pending',
    newValue: 'Approved',
    ip: meta.ip,
  })

  return toDto(updated)
}

async function process(id: string, input: ProcessPayoutInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<PayoutDto> {
  const payout = await payoutRepository.findById(id)
  if (!payout) throw ApiError.notFound('Payout not found')
  if (payout.status !== 'Approved') throw ApiError.conflict(`Cannot process a payout in "${payout.status}" status`)

  const processedAt = new Date()
  const updated = await payoutRepository.updateById(id, {
    status: 'Paid',
    method: input.method,
    transactionId: input.transactionId,
    processedBy: toObjectId(actor.id),
    processedAt,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Payout not found')

  await auditService.record({
    actor,
    action: 'Payout Processed',
    entityType: 'Payout',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: 'Approved',
    newValue: `Paid — ${input.method} (${input.transactionId})`,
    ip: meta.ip,
  })

  const farmer = await farmerRepository.findById(updated.farmerId.toString())
  payoutEvents.emit(PAYOUT_EVENTS.PAID, {
    payoutId: id,
    payoutCode: updated.payoutCode,
    farmerId: updated.farmerId.toString(),
    farmerUserId: farmer?.userId.toString() ?? '',
    amount: updated.amount,
    method: input.method,
    transactionId: input.transactionId,
    paidAt: processedAt,
  })

  return toDto(updated)
}

async function reject(id: string, input: RejectPayoutInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<PayoutDto> {
  const payout = await payoutRepository.findById(id)
  if (!payout) throw ApiError.notFound('Payout not found')
  if (payout.status !== 'Pending' && payout.status !== 'Approved') {
    throw ApiError.conflict(`Cannot reject a payout in "${payout.status}" status`)
  }

  const previousStatus = payout.status
  const rejectedAt = new Date()
  const updated = await payoutRepository.updateById(id, {
    status: 'Rejected',
    rejectedBy: toObjectId(actor.id),
    rejectedAt,
    rejectionReason: input.reason,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Payout not found')

  await auditService.record({
    actor,
    action: 'Payout Rejected',
    entityType: 'Payout',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousStatus,
    newValue: `Rejected — ${input.reason}`,
    ip: meta.ip,
  })

  return toDto(updated)
}

async function getFarmerSummary(farmerId: string): Promise<FarmerPayoutSummaryDto> {
  const farmer = await farmerRepository.findById(farmerId)
  if (!farmer) throw ApiError.notFound('Farmer not found')

  const payouts = await payoutRepository.findByFarmerId(farmerId)
  const outstandingBalance = round2(payouts.filter((p) => OUTSTANDING_STATUSES.includes(p.status)).reduce((sum, p) => sum + p.amount, 0))
  const totalPaid = round2(payouts.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0))

  return {
    farmerId,
    farmerName: `${farmer.firstName} ${farmer.lastName}`,
    outstandingBalance,
    totalPaid,
    payoutCount: payouts.length,
  }
}

async function getStatsSummary(): Promise<PayoutStatsSummaryDto> {
  const payouts = await payoutRepository.findAllActive()

  const byStatus = PAYOUT_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {} as Record<PayoutStatus, number>)
  for (const payout of payouts) byStatus[payout.status] += 1

  return {
    payoutCount: payouts.length,
    byStatus,
    totalOutstanding: round2(payouts.filter((p) => OUTSTANDING_STATUSES.includes(p.status)).reduce((sum, p) => sum + p.amount, 0)),
    totalPaid: round2(payouts.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0)),
  }
}

export const payoutService = {
  createFromConfirmedOrder,
  getById,
  list,
  approve,
  process,
  reject,
  getFarmerSummary,
  getStatsSummary,
}
