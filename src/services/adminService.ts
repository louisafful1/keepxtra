import type {
  AdminDashboardStats,
  AdminPayoutRecord,
  AdminPickupRequest,
  AdminSaleRecord,
  AdminStorageRequest,
  CreateInspectionInput,
  CreateSaleInput,
  FarmerAccount,
  FarmerAccountStatus,
  FleetVehicle,
  InspectionRecord,
  InventoryItem,
  OrderRecord,
  RevenueTrendPoint,
  SalesTrendPoint,
  StorageUtilizationPoint,
  WarehouseReceipt,
  WarehouseReceivingInput,
  WarehouseRecord,
} from '@/types/admin'
import type { PickupStatus } from '@/types/farmer'
import type { ActivityEvent } from '@/types/activity'
import {
  mockFleet,
  mockFarmerAccounts,
  mockOrders,
  mockRevenueTrend,
  mockSalesTrend,
  mockStorageUtilization,
  mockWarehouses,
} from '@/services/mock/adminMockData'
import {
  CURRENT_FARMER_NAME,
  addActivity,
  generateId,
  mockActivityLog,
  mockAdminPayouts,
  mockAdminSales,
  mockInspections,
  mockInventoryItems,
  mockPickups,
  mockStorageRequests,
  mockWarehouseReceipts,
  notifyFarmer,
} from '@/services/mock/sharedMockData'
import { simulateMutation, simulateRequest } from '@/services/simulateRequest'

function notifyIfCurrentFarmer(farmerName: string, type: Parameters<typeof notifyFarmer>[0], title: string, message: string) {
  if (farmerName === CURRENT_FARMER_NAME) notifyFarmer(type, title, message)
}

const COMMISSION_RATE = 0.2

// ================= Dashboard =================

async function getDashboardStats(): Promise<AdminDashboardStats> {
  const produceInStorageKg = mockInventoryItems
    .filter((i) => i.status === 'In Storage')
    .reduce((sum, i) => sum + i.quantityKg, 0)

  const todaysPickups = mockPickups.filter((p) => p.status === 'Driver Assigned' || p.status === 'Driver En Route').length

  const inventoryValue = mockInventoryItems
    .filter((i) => i.status === 'In Storage' || i.status === 'Reserved' || i.status === 'Pending Inspection')
    .reduce((sum, i) => sum + i.quantityKg * i.unitValue, 0)

  const totalCapacity = mockWarehouses.reduce((sum, w) => sum + w.coldRoomCapacityKg, 0)
  const totalOccupancy = mockWarehouses.reduce((sum, w) => sum + w.currentOccupancyKg, 0)

  const pendingApprovals =
    mockStorageRequests.filter((r) => r.status === 'Pending').length +
    mockPickups.filter((p) => p.status === 'Pending').length +
    mockAdminPayouts.filter((p) => p.status === 'Pending').length

  const upcomingDeliveries = mockAdminSales.filter((s) => s.paymentStatus !== 'Paid').length

  const stats: AdminDashboardStats = {
    registeredFarmers: mockFarmerAccounts.length,
    produceInStorageKg,
    todaysPickups,
    inventoryValue,
    warehouseOccupancyPct: totalCapacity ? Math.round((totalOccupancy / totalCapacity) * 100) : 0,
    revenue: mockRevenueTrend[mockRevenueTrend.length - 1]?.revenue ?? 0,
    pendingApprovals,
    upcomingDeliveries,
  }

  return simulateRequest(stats)
}

// ================= Farmers =================

async function getFarmers(): Promise<FarmerAccount[]> {
  return simulateRequest(mockFarmerAccounts)
}

async function registerFarmer(input: { name: string; email: string; phone: string; farmLocation: string }): Promise<FarmerAccount> {
  const created: FarmerAccount = {
    id: generateId('far'),
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

// ================= Storage requests =================

async function getStorageRequests(): Promise<AdminStorageRequest[]> {
  return simulateRequest(mockStorageRequests)
}

async function approveStorageRequest(id: string): Promise<AdminPickupRequest | null> {
  const request = mockStorageRequests.find((r) => r.id === id)
  if (!request) return simulateMutation(null)

  request.status = 'Approved'

  const pickup: AdminPickupRequest = {
    id: generateId('pkp'),
    storageRequestId: request.id,
    farmerName: request.farmerName,
    crop: request.crop,
    quantityKg: request.quantityKg,
    pickupLocation: request.pickupLocation,
    preferredPickupDate: request.preferredPickupDate,
    status: 'Approved',
    createdAt: new Date().toISOString().slice(0, 10),
  }
  mockPickups.unshift(pickup)
  request.linkedPickupRequestId = pickup.id

  addActivity('storage-request-approved', 'Storage Request Approved', `${request.crop} (${request.quantityKg}kg) approved — pickup request created.`)
  notifyIfCurrentFarmer(
    request.farmerName,
    'storage-request',
    'Storage Request Approved',
    `Your request to store ${request.quantityKg}kg of ${request.crop} was approved. A pickup has been scheduled.`,
  )

  return simulateMutation(pickup)
}

async function rejectStorageRequest(id: string, reason: string): Promise<AdminStorageRequest | null> {
  const request = mockStorageRequests.find((r) => r.id === id)
  if (!request) return simulateMutation(null)
  request.status = 'Rejected'
  request.reviewNotes = reason

  addActivity('storage-request-rejected', 'Storage Request Rejected', `${request.crop} (${request.quantityKg}kg) was rejected: ${reason}`)
  notifyIfCurrentFarmer(request.farmerName, 'storage-request', 'Storage Request Rejected', `Your request for ${request.crop} was rejected: ${reason}`)

  return simulateMutation(request)
}

async function requestStorageInfo(id: string, message: string): Promise<AdminStorageRequest | null> {
  const request = mockStorageRequests.find((r) => r.id === id)
  if (!request) return simulateMutation(null)
  request.status = 'Info Requested'
  request.reviewNotes = message

  addActivity('storage-request-info-requested', 'More Information Requested', `Operations requested more info on ${request.crop}: ${message}`)
  notifyIfCurrentFarmer(request.farmerName, 'storage-request', 'More Information Needed', `KeepXtra needs more details on your ${request.crop} request: ${message}`)

  return simulateMutation(request)
}

// ================= Pickup management =================

async function getPickupRequests(): Promise<AdminPickupRequest[]> {
  return simulateRequest(mockPickups)
}

async function approvePickupRequest(id: string): Promise<AdminPickupRequest | null> {
  const pickup = mockPickups.find((p) => p.id === id)
  if (!pickup) return simulateMutation(null)
  pickup.status = 'Approved'

  addActivity('pickup-approved', 'Pickup Approved', `Pickup for ${pickup.crop} (${pickup.quantityKg}kg) approved.`)
  notifyIfCurrentFarmer(pickup.farmerName, 'pickup', 'Pickup Approved', `Your pickup request for ${pickup.crop} has been approved.`)

  return simulateMutation(pickup)
}

async function updatePickupAssignment(input: {
  id: string
  driverName: string
  vehiclePlate: string
  pickupDate: string
  notes?: string
}): Promise<AdminPickupRequest | null> {
  const pickup = mockPickups.find((p) => p.id === input.id)
  if (!pickup) return simulateMutation(null)

  pickup.driverName = input.driverName
  pickup.vehiclePlate = input.vehiclePlate
  pickup.pickupDate = input.pickupDate
  pickup.notes = input.notes
  pickup.status = 'Driver Assigned'

  addActivity('driver-assigned', 'Driver Assigned', `${input.driverName} (${input.vehiclePlate}) assigned to collect ${pickup.crop}.`)
  notifyIfCurrentFarmer(pickup.farmerName, 'pickup', 'Driver Assigned', `${input.driverName} has been assigned to collect your ${pickup.crop} on ${input.pickupDate}.`)

  return simulateMutation(pickup)
}

async function advancePickupStatus(id: string, status: PickupStatus): Promise<AdminPickupRequest | null> {
  const pickup = mockPickups.find((p) => p.id === id)
  if (!pickup) return simulateMutation(null)
  pickup.status = status

  if (status === 'Collected') {
    addActivity('produce-collected', 'Produce Collected', `${pickup.crop} (${pickup.quantityKg}kg) collected from ${pickup.pickupLocation}.`)
    notifyIfCurrentFarmer(pickup.farmerName, 'pickup', 'Produce Collected', `Your ${pickup.crop} has been collected and is on its way to the warehouse.`)
  }

  return simulateMutation(pickup)
}

// ================= Warehouse receiving =================

async function receiveAtWarehouse(input: WarehouseReceivingInput): Promise<WarehouseReceipt | null> {
  const pickup = mockPickups.find((p) => p.id === input.pickupId)
  if (!pickup) return simulateMutation(null)

  const inventoryItem: InventoryItem = {
    id: generateId('inv'),
    crop: input.crop,
    farmerName: pickup.farmerName,
    quantityKg: input.quantityKg,
    grade: input.grade,
    warehouse: input.warehouse,
    coldRoom: input.coldRoom,
    storageBin: input.storageBin,
    storageDate: input.storageDate,
    expiryDate: input.expiryDate,
    shelfLifeDays: input.shelfLifeDays,
    unitValue: 5,
    status: 'Pending Inspection',
    sourcePickupId: pickup.id,
  }
  mockInventoryItems.unshift(inventoryItem)

  const receipt: WarehouseReceipt = {
    id: generateId('wrc'),
    ...input,
    farmerName: pickup.farmerName,
    receivedAt: new Date().toISOString(),
    inventoryItemId: inventoryItem.id,
  }
  mockWarehouseReceipts.unshift(receipt)

  pickup.status = 'Completed'

  const warehouse = mockWarehouses.find((w) => w.name === input.warehouse)
  if (warehouse) warehouse.currentOccupancyKg = Math.min(warehouse.coldRoomCapacityKg, warehouse.currentOccupancyKg + input.quantityKg)

  addActivity('produce-received', 'Produce Received', `${input.quantityKg}kg of ${input.crop} received at ${input.warehouse} (${input.coldRoom}).`)
  notifyIfCurrentFarmer(pickup.farmerName, 'pickup', 'Produce Received', `Your ${input.crop} arrived safely at ${input.warehouse} and is awaiting quality inspection.`)

  return simulateMutation(receipt)
}

// ================= Inventory =================

async function getInventory(): Promise<InventoryItem[]> {
  return simulateRequest(mockInventoryItems)
}

// ================= Quality inspection =================

async function getInspections(): Promise<InspectionRecord[]> {
  return simulateRequest(mockInspections)
}

async function createInspection(input: CreateInspectionInput): Promise<InspectionRecord | null> {
  const item = mockInventoryItems.find((i) => i.id === input.inventoryItemId)
  if (!item) return simulateMutation(null)

  const record: InspectionRecord = {
    ...input,
    id: generateId('insp'),
    crop: item.crop,
    farmerName: item.farmerName,
    inspectionDate: new Date().toISOString().slice(0, 10),
    photos: ['inspection-photo-1.jpg', 'inspection-photo-2.jpg'],
  }
  mockInspections.unshift(record)

  if (input.outcome === 'Approved') {
    item.status = 'In Storage'
    item.grade = input.grade
  } else if (input.outcome === 'Rejected') {
    item.status = 'Disposed'
  } else {
    item.quantityKg = input.acceptedQuantityKg ?? item.quantityKg
    item.status = 'In Storage'
    item.grade = input.grade
  }

  addActivity('inspection-completed', 'Inspection Completed', `${item.crop} inspected by ${input.inspector}: ${input.outcome}.`)
  notifyIfCurrentFarmer(item.farmerName, 'inspection', 'Inspection Complete', `Your ${item.crop} was inspected: ${input.outcome} (Grade ${input.grade}).`)

  return simulateMutation(record)
}

// ================= Fleet, warehouses, orders =================

async function getFleet(): Promise<FleetVehicle[]> {
  return simulateRequest(mockFleet)
}

async function getWarehouses(): Promise<WarehouseRecord[]> {
  return simulateRequest(mockWarehouses)
}

async function getOrders(): Promise<OrderRecord[]> {
  return simulateRequest(mockOrders)
}

// ================= Sales =================

async function getSales(): Promise<AdminSaleRecord[]> {
  return simulateRequest(mockAdminSales)
}

async function createSale(input: CreateSaleInput): Promise<AdminSaleRecord | null> {
  const item = mockInventoryItems.find((i) => i.id === input.inventoryItemId)
  if (!item) return simulateMutation(null)

  const commission = Math.round(input.sellingPrice * COMMISSION_RATE)
  const farmerEarnings = input.sellingPrice - commission

  const sale: AdminSaleRecord = {
    id: generateId('sale'),
    crop: item.crop,
    farmerName: item.farmerName,
    buyer: input.buyer,
    buyerType: input.buyerType,
    quantityKg: input.quantityKg,
    saleDate: new Date().toISOString().slice(0, 10),
    deliveryDate: input.deliveryDate,
    sellingPrice: input.sellingPrice,
    commission,
    farmerEarnings,
    paymentStatus: 'Pending',
    invoiceId: `INV-${Math.floor(30000 + Math.random() * 9999)}`,
  }
  mockAdminSales.unshift(sale)

  item.quantityKg = Math.max(0, item.quantityKg - input.quantityKg)
  if (item.quantityKg === 0) item.status = 'Sold'

  const farmerAccount = mockFarmerAccounts.find((f) => f.name === item.farmerName)
  if (farmerAccount) farmerAccount.totalEarnings += farmerEarnings

  addActivity('sale-completed', 'Sale Completed', `${input.quantityKg}kg of ${item.crop} sold to ${input.buyer} for GHS ${input.sellingPrice.toLocaleString()}.`)
  notifyIfCurrentFarmer(item.farmerName, 'sale', 'Produce Sold', `${input.quantityKg}kg of ${item.crop} was sold to ${input.buyer} for GHS ${input.sellingPrice.toLocaleString()}.`)

  return simulateMutation(sale)
}

// ================= Payments =================

async function getPayouts(): Promise<AdminPayoutRecord[]> {
  return simulateRequest(mockAdminPayouts)
}

async function approvePayout(id: string): Promise<AdminPayoutRecord | null> {
  const payout = mockAdminPayouts.find((p) => p.id === id)
  if (!payout) return simulateMutation(null)
  payout.status = 'Approved'

  addActivity('payment-approved', 'Payment Approved', `Payout of GHS ${payout.amount.toLocaleString()} to ${payout.farmerName} approved.`)
  notifyIfCurrentFarmer(payout.farmerName, 'payment', 'Payment Approved', `Your payout request of GHS ${payout.amount.toLocaleString()} has been approved and is being processed.`)

  return simulateMutation(payout)
}

async function rejectPayout(id: string, reason: string): Promise<AdminPayoutRecord | null> {
  const payout = mockAdminPayouts.find((p) => p.id === id)
  if (!payout) return simulateMutation(null)
  payout.status = 'Rejected'
  payout.rejectionReason = reason

  addActivity('payment-rejected', 'Payment Rejected', `Payout of GHS ${payout.amount.toLocaleString()} to ${payout.farmerName} rejected: ${reason}`)
  notifyIfCurrentFarmer(payout.farmerName, 'payment', 'Payment Rejected', `Your payout request was rejected: ${reason}`)

  return simulateMutation(payout)
}

async function processPayout(id: string): Promise<AdminPayoutRecord | null> {
  const payout = mockAdminPayouts.find((p) => p.id === id)
  if (!payout) return simulateMutation(null)
  payout.status = 'Paid'
  payout.completedAt = new Date().toISOString().slice(0, 10)

  addActivity('payment-sent', 'Payment Sent', `GHS ${payout.amount.toLocaleString()} paid out to ${payout.farmerName} via ${payout.method}.`)
  notifyIfCurrentFarmer(payout.farmerName, 'payment', 'Payment Sent', `GHS ${payout.amount.toLocaleString()} has been sent to your ${payout.method} account.`)

  return simulateMutation(payout)
}

// ================= Reports & activity =================

async function getRevenueTrend(): Promise<RevenueTrendPoint[]> {
  return simulateRequest(mockRevenueTrend)
}

async function getStorageUtilization(): Promise<StorageUtilizationPoint[]> {
  return simulateRequest(mockStorageUtilization)
}

async function getSalesTrend(): Promise<SalesTrendPoint[]> {
  return simulateRequest(mockSalesTrend)
}

async function getActivityTimeline(): Promise<ActivityEvent[]> {
  return simulateRequest(mockActivityLog.slice(0, 20))
}

export const adminService = {
  getDashboardStats,
  getFarmers,
  registerFarmer,
  updateFarmerStatus,
  getStorageRequests,
  approveStorageRequest,
  rejectStorageRequest,
  requestStorageInfo,
  getPickupRequests,
  approvePickupRequest,
  updatePickupAssignment,
  advancePickupStatus,
  receiveAtWarehouse,
  getInventory,
  getInspections,
  createInspection,
  getFleet,
  getWarehouses,
  getOrders,
  getSales,
  createSale,
  getPayouts,
  approvePayout,
  rejectPayout,
  processPayout,
  getRevenueTrend,
  getStorageUtilization,
  getSalesTrend,
  getActivityTimeline,
}
