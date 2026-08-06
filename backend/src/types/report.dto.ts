export interface RevenueReportDto {
  trend: { year: number; month: number; orderCount: number; totalRevenue: number; farmerEarnings: number; profit: number }[]
  totals: { orderCount: number; totalRevenue: number; farmerEarnings: number; profit: number }
}

export interface FarmerReportDto {
  topFarmers: { farmerId: string; farmerName: string; farmerNumber: string; totalPaid: number; payoutCount: number }[]
  totalFarmers: number
  activeFarmers: number
}

export interface WarehouseReportDto {
  warehouses: {
    warehouseCode: string
    name: string
    totalCapacityKg: number
    currentOccupancyKg: number
    utilizationPercent: number
    status: string
  }[]
  averageUtilizationPercent: number
}

export interface InventoryReportDto {
  byProduceType: { produceType: string; quantity: number; totalValue: number }[]
  byWarehouse: { warehouseCode: string; warehouseName: string; quantity: number }[]
  byStatus: Record<string, number>
}

export interface SalesReportDto {
  byStatus: { status: string; orderCount: number }[]
  byCustomerType: { customerType: string; orderCount: number; totalRevenue: number }[]
  totals: { orderCount: number; totalRevenue: number }
}

export interface PaymentReportDto {
  byStatus: { status: string; count: number; amount: number }[]
  totalOutstanding: number
  totalPaid: number
}

export interface PickupReportDto {
  byStatus: { status: string; count: number }[]
  totalPickups: number
  completionRate: number
  averageTurnaroundHours: number | null
}

export interface FleetReportDto {
  vehiclesByStatus: { status: string; count: number }[]
  totalMaintenanceCost: number
  totalFuelCost: number
  totalDrivers: number
  availableDrivers: number
}

export interface InspectionReportDto {
  byGrade: { grade: string; count: number }[]
  byStatus: { status: string; count: number }[]
  totalInspections: number
  rejectionRatePercent: number
}

export interface DashboardSummaryDto {
  totalFarmers: number
  activeFarmers: number
  pendingStorageRequests: number
  activePickups: number
  inStockInventoryCount: number
  pendingInspections: number
  ordersThisMonth: number
  revenueThisMonth: number
  pendingPayoutsAmount: number
  availableVehicles: number
}
