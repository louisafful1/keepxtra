import type {
  AdminDashboardStats,
  AdminPayoutRecord,
  AdminPickupRequest,
  AdminSaleRecord,
  FarmerAccount,
  FarmerAccountStatus,
  FleetVehicle,
  InventoryItem,
  OrderRecord,
  RevenueTrendPoint,
  StorageUtilizationPoint,
  WarehouseRecord,
} from '@/types/admin'
import {
  mockAdminDashboardStats,
  mockAdminPayouts,
  mockAdminPickupRequests,
  mockAdminSales,
  mockFarmerAccounts,
  mockFleet,
  mockInventory,
  mockOrders,
  mockRevenueTrend,
  mockStorageUtilization,
  mockWarehouses,
} from '@/services/mock/adminMockData'
import { simulateMutation, simulateRequest } from '@/services/simulateRequest'

async function getDashboardStats(): Promise<AdminDashboardStats> {
  return simulateRequest(mockAdminDashboardStats)
}

async function getFarmers(): Promise<FarmerAccount[]> {
  return simulateRequest(mockFarmerAccounts)
}

async function registerFarmer(input: { name: string; email: string; phone: string; farmLocation: string }): Promise<FarmerAccount> {
  const created: FarmerAccount = {
    id: `far-${Math.floor(1000 + Math.random() * 9000)}`,
    name: input.name,
    email: input.email,
    phone: input.phone,
    farmLocation: input.farmLocation,
    status: 'Pending Review',
    joinedAt: new Date().toISOString().slice(0, 10),
    totalProduceKg: 0,
    totalEarnings: 0,
  }
  mockFarmerAccounts.unshift(created)
  return simulateMutation(created)
}

async function updateFarmerStatus(id: string, status: FarmerAccountStatus): Promise<{ id: string; status: FarmerAccountStatus }> {
  const farmer = mockFarmerAccounts.find((f) => f.id === id)
  if (farmer) farmer.status = status
  return simulateMutation({ id, status })
}

async function getInventory(): Promise<InventoryItem[]> {
  return simulateRequest(mockInventory)
}

async function getWarehouses(): Promise<WarehouseRecord[]> {
  return simulateRequest(mockWarehouses)
}

async function getPickupRequests(): Promise<AdminPickupRequest[]> {
  return simulateRequest(mockAdminPickupRequests)
}

async function approvePickupRequest(id: string): Promise<{ id: string; status: 'Approved' }> {
  const pickup = mockAdminPickupRequests.find((p) => p.id === id)
  if (pickup) pickup.status = 'Approved'
  return simulateMutation({ id, status: 'Approved' })
}

async function assignDriver(id: string, driverName: string, vehiclePlate: string) {
  const pickup = mockAdminPickupRequests.find((p) => p.id === id)
  if (pickup) {
    pickup.driverName = driverName
    pickup.vehiclePlate = vehiclePlate
    pickup.status = 'Vehicle Assigned'
  }
  return simulateMutation({ id, driverName, vehiclePlate, status: 'Vehicle Assigned' as const })
}

async function getFleet(): Promise<FleetVehicle[]> {
  return simulateRequest(mockFleet)
}

async function getOrders(): Promise<OrderRecord[]> {
  return simulateRequest(mockOrders)
}

async function getSales(): Promise<AdminSaleRecord[]> {
  return simulateRequest(mockAdminSales)
}

async function getPayouts(): Promise<AdminPayoutRecord[]> {
  return simulateRequest(mockAdminPayouts)
}

async function processPayout(id: string): Promise<{ id: string; status: 'Paid' }> {
  const payout = mockAdminPayouts.find((p) => p.id === id)
  if (payout) payout.status = 'Paid'
  return simulateMutation({ id, status: 'Paid' })
}

async function getRevenueTrend(): Promise<RevenueTrendPoint[]> {
  return simulateRequest(mockRevenueTrend)
}

async function getStorageUtilization(): Promise<StorageUtilizationPoint[]> {
  return simulateRequest(mockStorageUtilization)
}

export const adminService = {
  getDashboardStats,
  getFarmers,
  registerFarmer,
  updateFarmerStatus,
  getInventory,
  getWarehouses,
  getPickupRequests,
  approvePickupRequest,
  assignDriver,
  getFleet,
  getOrders,
  getSales,
  getPayouts,
  processPayout,
  getRevenueTrend,
  getStorageUtilization,
}
