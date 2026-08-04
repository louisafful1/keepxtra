export type ProduceStatus = 'In Storage' | 'Reserved' | 'Sold' | 'Disposed'

export interface ProduceRecord {
  id: string
  crop: string
  quantityKg: number
  grade: 'A' | 'B' | 'C'
  warehouseLocation: string
  dateStored: string
  estimatedShelfLifeDays: number
  status: ProduceStatus
}

export type PickupStatus =
  | 'Pending'
  | 'Approved'
  | 'Vehicle Assigned'
  | 'Driver En Route'
  | 'Collected'
  | 'Delivered to Warehouse'

export interface StorageRequestInput {
  crop: string
  quantityKg: number
  harvestDate: string
  pickupLocation: string
  preferredPickupDate: string
  notes?: string
}

export interface PickupRequest {
  id: string
  crop: string
  quantityKg: number
  pickupLocation: string
  preferredPickupDate: string
  status: PickupStatus
  driverName?: string
  vehiclePlate?: string
  notes?: string
  createdAt: string
}

export type PaymentStatus = 'Paid' | 'Pending' | 'Processing'

export interface SaleRecord {
  id: string
  crop: string
  quantityKg: number
  buyer: string
  saleDate: string
  sellingPrice: number
  farmerEarnings: number
  paymentStatus: PaymentStatus
}

export interface PayoutRecord {
  id: string
  amount: number
  requestedAt: string
  completedAt?: string
  status: PaymentStatus
  method: string
}

export interface FarmerPaymentsSummary {
  currentBalance: number
  pendingPayments: number
  totalPaidOut: number
  payoutHistory: PayoutRecord[]
}

export type NotificationType =
  | 'pickup'
  | 'inspection'
  | 'sale'
  | 'payment'
  | 'storage-reminder'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  createdAt: string
  read: boolean
}

export interface FarmerDashboardStats {
  produceInStorageKg: number
  pendingPickupRequests: number
  produceSoldKg: number
  currentEarnings: number
  storageCharges: number
  unreadNotifications: number
}

export interface FarmerProfile {
  id: string
  name: string
  email: string
  phone: string
  farmLocation: string
  preferredPayoutMethod: string
  payoutAccountNumber: string
}
