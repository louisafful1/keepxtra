import type { PayoutStatus, PickupStatus, ProduceStatus, StorageRequestStatus } from '@/types/farmer'

export interface AdminDashboardStats {
  registeredFarmers: number
  produceInStorageKg: number
  todaysPickups: number
  inventoryValue: number
  warehouseOccupancyPct: number
  revenue: number
  pendingApprovals: number
  upcomingDeliveries: number
}

export type FarmerAccountStatus = 'Active' | 'Suspended' | 'Pending Review'

export interface FarmerAccount {
  id: string
  name: string
  email: string
  phone: string
  farmLocation: string
  status: FarmerAccountStatus
  joinedAt: string
  totalProduceKg: number
  totalEarnings: number
}

export interface AdminStorageRequest {
  id: string
  farmerName: string
  crop: string
  quantityKg: number
  harvestDate: string
  pickupLocation: string
  preferredPickupDate: string
  notes?: string
  status: StorageRequestStatus
  reviewNotes?: string
  createdAt: string
  linkedPickupRequestId?: string
}

export interface InventoryItem {
  id: string
  crop: string
  farmerName: string
  quantityKg: number
  grade: 'A' | 'B' | 'C'
  warehouse: string
  coldRoom: string
  storageBin: string
  storageDate: string
  expiryDate: string
  shelfLifeDays: number
  unitValue: number
  status: ProduceStatus
  sourcePickupId?: string
}

export interface WarehouseReceivingInput {
  pickupId: string
  crop: string
  quantityKg: number
  weightKg: number
  grade: 'A' | 'B' | 'C'
  warehouse: string
  coldRoom: string
  storageBin: string
  shelfLifeDays: number
  storageDate: string
  expiryDate: string
}

export interface WarehouseReceipt extends WarehouseReceivingInput {
  id: string
  farmerName: string
  receivedAt: string
  inventoryItemId: string
}

export interface WarehouseRecord {
  id: string
  name: string
  location: string
  coldRoomCapacityKg: number
  currentOccupancyKg: number
  temperatureC: number
  lastLoggedAt: string
}

export interface AdminPickupRequest {
  id: string
  storageRequestId: string
  farmerName: string
  crop: string
  quantityKg: number
  pickupLocation: string
  preferredPickupDate: string
  pickupDate?: string
  status: PickupStatus
  driverName?: string
  vehiclePlate?: string
  notes?: string
  createdAt: string
}

export type VehicleStatus = 'Available' | 'On Route' | 'Maintenance'

export interface FleetVehicle {
  id: string
  plate: string
  type: string
  driverName: string
  status: VehicleStatus
  fuelLevelPct: number
  lastMaintenanceAt: string
  mileageKm: number
}

export type InspectionOutcome = 'Approved' | 'Rejected' | 'Partial Acceptance'

export interface CreateInspectionInput {
  inventoryItemId: string
  inspector: string
  grade: 'A' | 'B' | 'C'
  notes: string
  outcome: InspectionOutcome
  acceptedQuantityKg?: number
}

export interface InspectionRecord extends CreateInspectionInput {
  id: string
  crop: string
  farmerName: string
  inspectionDate: string
  photos: string[]
}

export type OrderStatus = 'Processing' | 'Confirmed' | 'Out for Delivery' | 'Delivered' | 'Cancelled'

export interface OrderRecord {
  id: string
  buyerName: string
  buyerType: 'Restaurant' | 'Hotel' | 'Retailer' | 'Wholesaler'
  items: string
  totalValue: number
  status: OrderStatus
  orderedAt: string
}

/** A sale's payment status (has KeepXtra collected from the buyer / paid the farmer's share). */
export type SalePaymentStatus = 'Paid' | 'Pending' | 'Processing'

export interface AdminSaleRecord {
  id: string
  crop: string
  farmerName: string
  buyer: string
  buyerType: OrderRecord['buyerType']
  quantityKg: number
  saleDate: string
  deliveryDate: string
  sellingPrice: number
  commission: number
  farmerEarnings: number
  paymentStatus: SalePaymentStatus
  invoiceId: string
}

export interface CreateSaleInput {
  inventoryItemId: string
  buyer: string
  buyerType: OrderRecord['buyerType']
  quantityKg: number
  sellingPrice: number
  deliveryDate: string
}

export interface AdminPayoutRecord {
  id: string
  farmerName: string
  amount: number
  requestedAt: string
  completedAt?: string
  status: PayoutStatus
  method: string
  rejectionReason?: string
}

export interface RevenueTrendPoint {
  label: string
  revenue: number
  storageFees: number
}

export interface StorageUtilizationPoint {
  warehouse: string
  usedPct: number
}

export interface SalesTrendPoint {
  label: string
  unitsKg: number
}
