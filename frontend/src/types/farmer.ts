export type ProduceStatus = 'Pending Inspection' | 'In Storage' | 'Reserved' | 'Sold' | 'Disposed'

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

export type StorageRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Info Requested'

export interface StorageRequestInput {
  crop: string
  quantityKg: number
  harvestDate: string
  pickupLocation: string
  preferredPickupDate: string
  notes?: string
}

export interface StorageRequest extends StorageRequestInput {
  id: string
  status: StorageRequestStatus
  createdAt: string
  reviewNotes?: string
  linkedPickupRequestId?: string
}

export type PickupStatus =
  | 'Pending'
  | 'Approved'
  | 'Driver Assigned'
  | 'Driver En Route'
  | 'Collected'
  | 'Delivered to Warehouse'
  | 'Completed'

export interface PickupRequest {
  id: string
  storageRequestId: string
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

/** Payment status of an individual sale transaction (distinct from payout status). */
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

/** Status of a farmer's payout request as it moves through operations review. */
export type PayoutStatus = 'Pending' | 'Approved' | 'Paid' | 'Rejected'

export interface PayoutRecord {
  id: string
  amount: number
  requestedAt: string
  completedAt?: string
  status: PayoutStatus
  method: string
  rejectionReason?: string
}

export interface FarmerPaymentsSummary {
  currentBalance: number
  pendingPayments: number
  totalPaidOut: number
  payoutHistory: PayoutRecord[]
}

export type NotificationType =
  | 'storage-request'
  | 'pickup'
  | 'inspection'
  | 'sale'
  | 'payment'
  | 'storage-reminder'
  | 'system'
  | 'warning'

export type NotificationCategory = 'Inventory' | 'Sales' | 'Payments' | 'Pickups' | 'System' | 'Warnings' | 'Alerts'

export const notificationCategoryByType: Record<NotificationType, NotificationCategory> = {
  'storage-request': 'Inventory',
  pickup: 'Pickups',
  inspection: 'Inventory',
  sale: 'Sales',
  payment: 'Payments',
  'storage-reminder': 'Alerts',
  system: 'System',
  warning: 'Warnings',
}

export interface NotificationItem {
  id: string
  type: NotificationType
  category: NotificationCategory
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
  pendingPayments: number
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
