import type { PickupStatus, ProduceStatus } from '@/types/farmer'

export interface AdminDashboardStats {
  registeredFarmers: number
  produceInStorageKg: number
  pendingPickups: number
  todaysDeliveries: number
  revenue: number
  storageCapacityUsedPct: number
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

export interface InventoryItem {
  id: string
  crop: string
  farmerName: string
  quantityKg: number
  grade: 'A' | 'B' | 'C'
  warehouse: string
  expiryDate: string
  status: ProduceStatus
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
  farmerName: string
  crop: string
  quantityKg: number
  pickupLocation: string
  preferredPickupDate: string
  status: PickupStatus
  driverName?: string
  vehiclePlate?: string
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

export interface AdminSaleRecord {
  id: string
  crop: string
  buyer: string
  buyerType: OrderRecord['buyerType']
  quantityKg: number
  saleDate: string
  sellingPrice: number
  commission: number
  invoiceId: string
}

export interface AdminPayoutRecord {
  id: string
  farmerName: string
  amount: number
  requestedAt: string
  status: 'Paid' | 'Pending' | 'Processing'
  method: string
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
