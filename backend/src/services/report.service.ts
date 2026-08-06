import { reportRepository } from '../repositories/report.repository'
import { farmerRepository } from '../repositories/farmer.repository'
import { orderRepository } from '../repositories/order.repository'
import { warehouseRepository } from '../repositories/warehouse.repository'
import { inventoryRepository } from '../repositories/inventory.repository'
import { pickupRepository } from '../repositories/pickup.repository'
import { vehicleRepository } from '../repositories/vehicle.repository'
import { driverRepository } from '../repositories/driver.repository'
import { qualityInspectionRepository } from '../repositories/qualityInspection.repository'
import { storageRequestRepository } from '../repositories/storageRequest.repository'
import { vehicleMaintenanceRecordRepository } from '../repositories/vehicleMaintenanceRecord.repository'
import { vehicleFuelRecordRepository } from '../repositories/vehicleFuelRecord.repository'
import type { CsvCellValue } from '../utils/csv'
import type {
  DashboardSummaryDto,
  FarmerReportDto,
  FleetReportDto,
  InspectionReportDto,
  InventoryReportDto,
  PaymentReportDto,
  PickupReportDto,
  RevenueReportDto,
  SalesReportDto,
  WarehouseReportDto,
} from '../types/report.dto'
import type { FarmerReportQuery, ReportQuery } from '../validators/report.validators'

export interface ReportResult<T> {
  dto: T
  /** A flat table representation of the same data — what CSV/PDF export renders. */
  rows: Record<string, CsvCellValue>[]
}

const PENDING_STORAGE_REQUEST_STATUSES = ['Submitted', 'Under Review'] as const
const ACTIVE_PICKUP_STATUSES = ['Pending', 'Scheduled', 'En Route', 'Arrived', 'Collected'] as const
const PICKUP_STATUSES = ['Pending', 'Scheduled', 'En Route', 'Arrived', 'Collected', 'Completed', 'Cancelled'] as const
const ORDER_STATUSES = ['Draft', 'Confirmed', 'Delivered', 'Cancelled'] as const
const INVENTORY_STATUSES = ['Pending Placement', 'In Stock', 'Depleted', 'Disposed'] as const
const VEHICLE_STATUSES = ['Available', 'On Trip', 'Under Maintenance', 'Out of Service'] as const
const QUALITY_GRADES = ['A', 'B', 'C', 'Rejected'] as const
const QUALITY_INSPECTION_STATUSES = ['Pending', 'In Progress', 'Approved', 'Partially Accepted', 'Rejected'] as const
const OUTSTANDING_PAYOUT_STATUSES = ['Pending', 'Approved']

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function parseDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined
}

function parseDateRange(query: ReportQuery): { from?: Date; to?: Date } {
  return { from: parseDate(query.from), to: parseDate(query.to) }
}

async function getRevenueReport(query: ReportQuery): Promise<ReportResult<RevenueReportDto>> {
  const trend = await reportRepository.getRevenueTrend(parseDateRange(query))

  const totals = trend.reduce(
    (acc, p) => ({
      orderCount: acc.orderCount + p.orderCount,
      totalRevenue: round2(acc.totalRevenue + p.totalRevenue),
      farmerEarnings: round2(acc.farmerEarnings + p.farmerEarnings),
      profit: round2(acc.profit + p.profit),
    }),
    { orderCount: 0, totalRevenue: 0, farmerEarnings: 0, profit: 0 },
  )

  return {
    dto: { trend, totals },
    rows: trend.map((p) => ({
      Year: p.year,
      Month: p.month,
      Orders: p.orderCount,
      Revenue: p.totalRevenue,
      'Farmer Earnings': p.farmerEarnings,
      Profit: p.profit,
    })),
  }
}

async function getFarmerReport(query: FarmerReportQuery): Promise<ReportResult<FarmerReportDto>> {
  const limit = query.limit ?? 10
  const [topFarmers, totalFarmers, activeFarmers] = await Promise.all([
    reportRepository.getTopFarmersByEarnings(limit),
    farmerRepository.count({}),
    farmerRepository.count({ status: 'Active' }),
  ])

  return {
    dto: { topFarmers, totalFarmers, activeFarmers },
    rows: topFarmers.map((f) => ({
      Farmer: f.farmerName,
      'Farmer Number': f.farmerNumber,
      'Total Paid': f.totalPaid,
      Payouts: f.payoutCount,
    })),
  }
}

async function getWarehouseReport(): Promise<ReportResult<WarehouseReportDto>> {
  const warehouses = await warehouseRepository.findAllActive()

  const mapped = warehouses.map((w) => ({
    warehouseCode: w.warehouseCode,
    name: w.name,
    totalCapacityKg: w.totalCapacityKg,
    currentOccupancyKg: w.currentOccupancyKg,
    utilizationPercent: w.totalCapacityKg > 0 ? round2((w.currentOccupancyKg / w.totalCapacityKg) * 100) : 0,
    status: w.status,
  }))

  const averageUtilizationPercent = mapped.length > 0 ? round2(mapped.reduce((s, w) => s + w.utilizationPercent, 0) / mapped.length) : 0

  return {
    dto: { warehouses: mapped, averageUtilizationPercent },
    rows: mapped.map((w) => ({
      Warehouse: w.name,
      Code: w.warehouseCode,
      'Capacity (kg)': w.totalCapacityKg,
      'Occupied (kg)': w.currentOccupancyKg,
      'Utilization %': w.utilizationPercent,
      Status: w.status,
    })),
  }
}

async function getInventoryReport(): Promise<ReportResult<InventoryReportDto>> {
  const [byProduceType, byWarehouse, statusCounts] = await Promise.all([
    reportRepository.getInventoryByProduceType(),
    reportRepository.getInventoryByWarehouse(),
    Promise.all(INVENTORY_STATUSES.map(async (status) => [status, await inventoryRepository.count({ status })] as const)),
  ])

  const byStatus = Object.fromEntries(statusCounts)

  return {
    dto: { byProduceType, byWarehouse, byStatus },
    rows: byProduceType.map((p) => ({ 'Produce Type': p.produceType, Quantity: p.quantity, 'Total Value': p.totalValue })),
  }
}

async function getSalesReport(query: ReportQuery): Promise<ReportResult<SalesReportDto>> {
  const range = parseDateRange(query)
  const [byCustomerType, statusCounts] = await Promise.all([
    reportRepository.getSalesByCustomerType(range),
    Promise.all(ORDER_STATUSES.map(async (status) => ({ status, orderCount: await orderRepository.count({ status }) }))),
  ])

  const totals = {
    orderCount: byCustomerType.reduce((s, c) => s + c.orderCount, 0),
    totalRevenue: round2(byCustomerType.reduce((s, c) => s + c.totalRevenue, 0)),
  }

  return {
    dto: { byStatus: statusCounts, byCustomerType, totals },
    rows: statusCounts.map((s) => ({ Status: s.status, Orders: s.orderCount })),
  }
}

async function getPaymentReport(): Promise<ReportResult<PaymentReportDto>> {
  const byStatus = await reportRepository.getPayoutStatusBreakdown()

  const totalOutstanding = round2(
    byStatus.filter((s) => OUTSTANDING_PAYOUT_STATUSES.includes(s.status)).reduce((sum, s) => sum + s.amount, 0),
  )
  const totalPaid = round2(byStatus.find((s) => s.status === 'Paid')?.amount ?? 0)

  return {
    dto: { byStatus, totalOutstanding, totalPaid },
    rows: byStatus.map((s) => ({ Status: s.status, Count: s.count, Amount: s.amount })),
  }
}

async function getPickupReport(): Promise<ReportResult<PickupReportDto>> {
  const [counts, averageTurnaroundHours] = await Promise.all([
    Promise.all(PICKUP_STATUSES.map((status) => pickupRepository.count({ status }))),
    reportRepository.getPickupAverageTurnaroundHours(),
  ])

  const byStatus = PICKUP_STATUSES.map((status, i) => ({ status, count: counts[i]! }))
  const totalPickups = counts.reduce((a, b) => a + b, 0)
  const completedCount = byStatus.find((s) => s.status === 'Completed')?.count ?? 0
  const completionRate = totalPickups > 0 ? round2((completedCount / totalPickups) * 100) : 0

  return {
    dto: { byStatus, totalPickups, completionRate, averageTurnaroundHours },
    rows: byStatus.map((s) => ({ Status: s.status, Count: s.count })),
  }
}

async function getFleetReport(): Promise<ReportResult<FleetReportDto>> {
  const [vehicleCounts, totalMaintenanceCost, totalFuelCost, totalDrivers, availableDrivers] = await Promise.all([
    Promise.all(VEHICLE_STATUSES.map((status) => vehicleRepository.count({ status }))),
    vehicleMaintenanceRecordRepository.sumCostAmount(),
    vehicleFuelRecordRepository.sumCostAmount(),
    driverRepository.count({}),
    driverRepository.count({ status: 'Available' }),
  ])

  const vehiclesByStatus = VEHICLE_STATUSES.map((status, i) => ({ status, count: vehicleCounts[i]! }))

  return {
    dto: { vehiclesByStatus, totalMaintenanceCost: round2(totalMaintenanceCost), totalFuelCost: round2(totalFuelCost), totalDrivers, availableDrivers },
    rows: vehiclesByStatus.map((s) => ({ Status: s.status, Count: s.count })),
  }
}

async function getInspectionReport(): Promise<ReportResult<InspectionReportDto>> {
  const [gradeCounts, statusCounts, quantityTotals] = await Promise.all([
    Promise.all(QUALITY_GRADES.map((grade) => qualityInspectionRepository.count({ qualityGrade: grade }))),
    Promise.all(QUALITY_INSPECTION_STATUSES.map((status) => qualityInspectionRepository.count({ status }))),
    reportRepository.getInspectionQuantityTotals(),
  ])

  const byGrade = QUALITY_GRADES.map((grade, i) => ({ grade, count: gradeCounts[i]! }))
  const byStatus = QUALITY_INSPECTION_STATUSES.map((status, i) => ({ status, count: statusCounts[i]! }))
  const totalInspections = statusCounts.reduce((a, b) => a + b, 0)
  const rejectionRatePercent = quantityTotals.inspected > 0 ? round2((quantityTotals.rejected / quantityTotals.inspected) * 100) : 0

  return {
    dto: { byGrade, byStatus, totalInspections, rejectionRatePercent },
    rows: byGrade.map((g) => ({ Grade: g.grade, Count: g.count })),
  }
}

async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    totalFarmers,
    activeFarmers,
    pendingStorageRequests,
    activePickups,
    inStockInventoryCount,
    pendingInspections,
    monthTrend,
    payoutStatusBreakdown,
    availableVehicles,
  ] = await Promise.all([
    farmerRepository.count({}),
    farmerRepository.count({ status: 'Active' }),
    storageRequestRepository.count({ status: { $in: PENDING_STORAGE_REQUEST_STATUSES } }),
    pickupRepository.count({ status: { $in: ACTIVE_PICKUP_STATUSES } }),
    inventoryRepository.count({ status: 'In Stock' }),
    qualityInspectionRepository.count({ status: { $in: ['Pending', 'In Progress'] } }),
    reportRepository.getRevenueTrend({ from: startOfMonth }),
    reportRepository.getPayoutStatusBreakdown(),
    vehicleRepository.count({ status: 'Available' }),
  ])

  const pendingPayoutsAmount = round2(
    payoutStatusBreakdown.filter((s) => OUTSTANDING_PAYOUT_STATUSES.includes(s.status)).reduce((sum, s) => sum + s.amount, 0),
  )

  return {
    totalFarmers,
    activeFarmers,
    pendingStorageRequests,
    activePickups,
    inStockInventoryCount,
    pendingInspections,
    ordersThisMonth: monthTrend.reduce((s, p) => s + p.orderCount, 0),
    revenueThisMonth: round2(monthTrend.reduce((s, p) => s + p.totalRevenue, 0)),
    pendingPayoutsAmount,
    availableVehicles,
  }
}

export const reportService = {
  getRevenueReport,
  getFarmerReport,
  getWarehouseReport,
  getInventoryReport,
  getSalesReport,
  getPaymentReport,
  getPickupReport,
  getFleetReport,
  getInspectionReport,
  getDashboardSummary,
}
