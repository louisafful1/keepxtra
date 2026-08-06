import { Order } from '../models/order.model'
import { Payout } from '../models/payout.model'
import { Inventory } from '../models/inventory.model'
import { Pickup } from '../models/pickup.model'
import { QualityInspection } from '../models/qualityInspection.model'

export interface RevenueTrendPoint {
  year: number
  month: number
  orderCount: number
  totalRevenue: number
  farmerEarnings: number
  profit: number
}

export interface SalesByCustomerTypePoint {
  customerType: string
  orderCount: number
  totalRevenue: number
}

export interface TopFarmerPoint {
  farmerId: string
  farmerName: string
  farmerNumber: string
  totalPaid: number
  payoutCount: number
}

export interface InventoryByProduceTypePoint {
  produceType: string
  quantity: number
  totalValue: number
}

export interface InventoryByWarehousePoint {
  warehouseCode: string
  warehouseName: string
  quantity: number
}

interface DateRange {
  from?: Date
  to?: Date
}

/**
 * The one exception to "repositories own a single collection": reports are
 * inherently cross-cutting, so this is where genuine `.aggregate()`
 * pipelines live rather than pulling whole collections into memory (unlike
 * the `findAllActive()` + in-JS-reduce pattern every prior module's stats
 * summary uses — fine for that module's own bounded collection, but not
 * the right shape for a group-by-month trend or a $lookup-joined breakdown).
 */
export class ReportRepository {
  private dateMatch(field: string, range?: DateRange): Record<string, unknown> {
    if (!range || (!range.from && !range.to)) return {}
    const match: Record<string, Date> = {}
    if (range.from) match.$gte = range.from
    if (range.to) match.$lte = range.to
    return { [field]: match }
  }

  async getRevenueTrend(range?: DateRange): Promise<RevenueTrendPoint[]> {
    return Order.aggregate<RevenueTrendPoint>([
      { $match: { isDeleted: false, status: { $in: ['Confirmed', 'Delivered'] }, ...this.dateMatch('confirmedAt', range) } },
      {
        $group: {
          _id: { year: { $year: '$confirmedAt' }, month: { $month: '$confirmedAt' } },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          farmerEarnings: { $sum: '$farmerEarningsTotal' },
          profit: { $sum: '$profitAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: { _id: 0, year: '$_id.year', month: '$_id.month', orderCount: 1, totalRevenue: 1, farmerEarnings: 1, profit: 1 } },
    ]).exec()
  }

  async getSalesByCustomerType(range?: DateRange): Promise<SalesByCustomerTypePoint[]> {
    return Order.aggregate<SalesByCustomerTypePoint>([
      { $match: { isDeleted: false, status: { $in: ['Confirmed', 'Delivered'] }, ...this.dateMatch('confirmedAt', range) } },
      { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' },
      { $group: { _id: '$customer.type', orderCount: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } },
      { $sort: { totalRevenue: -1 } },
      { $project: { _id: 0, customerType: '$_id', orderCount: 1, totalRevenue: 1 } },
    ]).exec()
  }

  async getTopFarmersByEarnings(limit: number): Promise<TopFarmerPoint[]> {
    return Payout.aggregate<TopFarmerPoint>([
      { $match: { isDeleted: false, status: 'Paid' } },
      {
        $group: {
          _id: '$farmerId',
          farmerName: { $first: '$farmerName' },
          farmerNumber: { $first: '$farmerNumber' },
          totalPaid: { $sum: '$amount' },
          payoutCount: { $sum: 1 },
        },
      },
      { $sort: { totalPaid: -1 } },
      { $limit: limit },
      { $project: { _id: 0, farmerId: { $toString: '$_id' }, farmerName: 1, farmerNumber: 1, totalPaid: 1, payoutCount: 1 } },
    ]).exec()
  }

  async getInventoryByProduceType(): Promise<InventoryByProduceTypePoint[]> {
    return Inventory.aggregate<InventoryByProduceTypePoint>([
      { $match: { isDeleted: false, status: 'In Stock' } },
      {
        $group: {
          _id: '$produceType',
          quantity: { $sum: '$currentQuantity' },
          totalValue: { $sum: { $multiply: ['$currentQuantity', { $ifNull: ['$valuePerUnit', 0] }] } },
        },
      },
      { $sort: { totalValue: -1 } },
      { $project: { _id: 0, produceType: '$_id', quantity: 1, totalValue: 1 } },
    ]).exec()
  }

  async getInventoryByWarehouse(): Promise<InventoryByWarehousePoint[]> {
    return Inventory.aggregate<InventoryByWarehousePoint>([
      { $match: { isDeleted: false, status: 'In Stock', warehouseId: { $ne: null } } },
      { $group: { _id: { warehouseCode: '$warehouseCode', warehouseName: '$warehouseName' }, quantity: { $sum: '$currentQuantity' } } },
      { $sort: { quantity: -1 } },
      { $project: { _id: 0, warehouseCode: '$_id.warehouseCode', warehouseName: '$_id.warehouseName', quantity: 1 } },
    ]).exec()
  }

  /** Average hours between creation and completion for `Completed` pickups — `null` if none exist yet. */
  async getPickupAverageTurnaroundHours(): Promise<number | null> {
    const [result] = await Pickup.aggregate<{ avgHours: number }>([
      { $match: { isDeleted: false, status: 'Completed', completedAt: { $ne: null } } },
      { $project: { hours: { $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 3600000] } } },
      { $group: { _id: null, avgHours: { $avg: '$hours' } } },
    ]).exec()
    return result ? Math.round(result.avgHours * 100) / 100 : null
  }

  async getPayoutStatusBreakdown(): Promise<{ status: string; count: number; amount: number }[]> {
    return Payout.aggregate<{ status: string; count: number; amount: number }>([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      { $project: { _id: 0, status: '$_id', count: 1, amount: 1 } },
    ]).exec()
  }

  /** Sums across every inspection that has been submitted (`inspectedQuantity` set) — used to derive a platform-wide rejection rate. */
  async getInspectionQuantityTotals(): Promise<{ inspected: number; rejected: number }> {
    const [result] = await QualityInspection.aggregate<{ inspected: number; rejected: number }>([
      { $match: { isDeleted: false, inspectedQuantity: { $ne: null } } },
      { $group: { _id: null, inspected: { $sum: '$inspectedQuantity' }, rejected: { $sum: { $ifNull: ['$rejectedQuantity', 0] } } } },
    ]).exec()
    return { inspected: result?.inspected ?? 0, rejected: result?.rejected ?? 0 }
  }
}

export const reportRepository = new ReportRepository()
