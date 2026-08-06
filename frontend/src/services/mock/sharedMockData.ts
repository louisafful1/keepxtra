import type {
  AdminPayoutRecord,
  AdminPickupRequest,
  AdminSaleRecord,
  AdminStorageRequest,
  InspectionRecord,
  InventoryItem,
  WarehouseReceipt,
} from '@/types/admin'
import type { ActivityEvent, ActivityType } from '@/types/activity'
import type { NotificationItem, NotificationType } from '@/types/farmer'
import { notificationCategoryByType } from '@/types/farmer'
import type { AuditLogEntry } from '@/types/audit'
import type { Driver } from '@/types/driver'
import { mockFarmerNotifications } from '@/services/mock/farmerMockData'

/** Single demo farmer — every "current farmer" query filters down to this name. */
export const CURRENT_FARMER_NAME = 'Kwame Asante'
/** Single demo admin — attributed as the actor on every audit log entry. */
export const CURRENT_ADMIN_NAME = 'Ama Serwaa'

export function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
}

// ================= Storage Requests (canonical) =================

export const mockStorageRequests: AdminStorageRequest[] = [
  {
    id: 'str-3001',
    farmerName: CURRENT_FARMER_NAME,
    crop: 'Sweet Potatoes',
    quantityKg: 650,
    harvestDate: '2026-07-26',
    pickupLocation: 'Nsawam Farm Gate',
    preferredPickupDate: '2026-08-06',
    status: 'Pending',
    createdAt: '2026-07-28',
  },
  {
    id: 'str-2994',
    farmerName: CURRENT_FARMER_NAME,
    crop: 'Plantain',
    quantityKg: 700,
    harvestDate: '2026-07-20',
    pickupLocation: 'Nsawam Farm Gate',
    preferredPickupDate: '2026-08-05',
    status: 'Approved',
    createdAt: '2026-07-22',
    linkedPickupRequestId: 'pkp-2201',
  },
]

// ================= Pickups (canonical) =================

export const mockPickups: AdminPickupRequest[] = [
  {
    id: 'pkp-2201',
    storageRequestId: 'str-2994',
    farmerName: CURRENT_FARMER_NAME,
    crop: 'Plantain',
    quantityKg: 700,
    pickupLocation: 'Nsawam Farm Gate',
    preferredPickupDate: '2026-08-05',
    pickupDate: '2026-08-05',
    status: 'Driver Assigned',
    driverName: 'Samuel Owusu',
    vehiclePlate: 'GT 4521-24',
    createdAt: '2026-07-28',
  },
  {
    id: 'pkp-2198',
    storageRequestId: 'str-2980',
    farmerName: CURRENT_FARMER_NAME,
    crop: 'Tomatoes',
    quantityKg: 300,
    pickupLocation: 'Nsawam Farm Gate',
    preferredPickupDate: '2026-08-02',
    pickupDate: '2026-08-02',
    status: 'Driver En Route',
    driverName: 'Yaw Boateng',
    vehiclePlate: 'GR 1187-23',
    createdAt: '2026-07-26',
  },
  {
    id: 'pkp-2190',
    storageRequestId: 'str-2970',
    farmerName: CURRENT_FARMER_NAME,
    crop: 'Cassava',
    quantityKg: 900,
    pickupLocation: 'Nsawam Farm Gate',
    preferredPickupDate: '2026-07-22',
    pickupDate: '2026-07-22',
    status: 'Completed',
    driverName: 'Samuel Owusu',
    vehiclePlate: 'GT 4521-24',
    createdAt: '2026-07-18',
  },
]

// ================= Inventory (canonical) =================

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv-01',
    crop: 'Tomatoes',
    farmerName: CURRENT_FARMER_NAME,
    quantityKg: 850,
    grade: 'A',
    warehouse: 'Accra Cold Hub 1',
    coldRoom: 'Cold Room A',
    storageBin: 'A-12',
    storageDate: '2026-07-02',
    expiryDate: '2026-08-12',
    shelfLifeDays: 21,
    unitValue: 6,
    status: 'In Storage',
  },
  {
    id: 'inv-02',
    crop: 'Onions',
    farmerName: 'Yaw Mensah',
    quantityKg: 3400,
    grade: 'B',
    warehouse: 'Kumasi Cold Hub',
    coldRoom: 'Cold Room B',
    storageBin: 'B-04',
    storageDate: '2026-06-25',
    expiryDate: '2026-09-01',
    shelfLifeDays: 45,
    unitValue: 4.5,
    status: 'In Storage',
  },
  {
    id: 'inv-03',
    crop: 'Green Peppers',
    farmerName: 'Abena Owusu',
    quantityKg: 620,
    grade: 'A',
    warehouse: 'Accra Cold Hub 1',
    coldRoom: 'Cold Room A',
    storageBin: 'A-07',
    storageDate: '2026-07-14',
    expiryDate: '2026-08-05',
    shelfLifeDays: 18,
    unitValue: 5.5,
    status: 'Reserved',
  },
  {
    id: 'inv-04',
    crop: 'Cabbage',
    farmerName: CURRENT_FARMER_NAME,
    quantityKg: 550,
    grade: 'A',
    warehouse: 'Accra Cold Hub 2',
    coldRoom: 'Cold Room C',
    storageBin: 'C-19',
    storageDate: '2026-07-18',
    expiryDate: '2026-08-14',
    shelfLifeDays: 25,
    unitValue: 3.8,
    status: 'In Storage',
  },
  {
    id: 'inv-05',
    crop: 'Plantain',
    farmerName: 'Efua Sarpong',
    quantityKg: 1100,
    grade: 'B',
    warehouse: 'Cape Coast Hub',
    coldRoom: 'Cold Room A',
    storageBin: 'A-22',
    storageDate: '2026-07-10',
    expiryDate: '2026-08-20',
    shelfLifeDays: 30,
    unitValue: 4.2,
    status: 'In Storage',
  },
  {
    id: 'inv-06',
    crop: 'Carrots',
    farmerName: CURRENT_FARMER_NAME,
    quantityKg: 400,
    grade: 'B',
    warehouse: 'Accra Cold Hub 1',
    coldRoom: 'Cold Room B',
    storageBin: 'B-11',
    storageDate: '2026-06-05',
    expiryDate: '2026-07-25',
    shelfLifeDays: 30,
    unitValue: 6,
    status: 'Sold',
  },
]

// ================= Warehouse receiving & inspections =================

export const mockWarehouseReceipts: WarehouseReceipt[] = []

export const mockInspections: InspectionRecord[] = [
  {
    id: 'insp-01',
    inventoryItemId: 'inv-01',
    crop: 'Tomatoes',
    farmerName: CURRENT_FARMER_NAME,
    inspectionDate: '2026-07-02',
    inspector: 'Ama Serwaa',
    grade: 'A',
    photos: ['batch-photo-1.jpg', 'batch-photo-2.jpg'],
    notes: 'Firm, uniform color, no visible bruising.',
    outcome: 'Approved',
  },
]

// ================= Sales & payouts (canonical) =================

export const mockAdminSales: AdminSaleRecord[] = [
  {
    id: 'sale-3301',
    crop: 'Carrots',
    farmerName: CURRENT_FARMER_NAME,
    buyer: 'Savanna Bistro',
    buyerType: 'Restaurant',
    quantityKg: 400,
    saleDate: '2026-07-20',
    deliveryDate: '2026-07-21',
    sellingPrice: 2400,
    commission: 480,
    farmerEarnings: 1920,
    paymentStatus: 'Paid',
    invoiceId: 'INV-30112',
  },
  {
    id: 'sale-3287',
    crop: 'Cassava',
    farmerName: CURRENT_FARMER_NAME,
    buyer: 'Metro Retail',
    buyerType: 'Retailer',
    quantityKg: 900,
    saleDate: '2026-07-15',
    deliveryDate: '2026-07-16',
    sellingPrice: 3150,
    commission: 630,
    farmerEarnings: 2520,
    paymentStatus: 'Paid',
    invoiceId: 'INV-30098',
  },
  {
    id: 'sale-3270',
    crop: 'Onions',
    farmerName: 'Yaw Mensah',
    buyer: 'Baobab Hotels',
    buyerType: 'Hotel',
    quantityKg: 600,
    saleDate: '2026-07-08',
    deliveryDate: '2026-08-03',
    sellingPrice: 2700,
    commission: 540,
    farmerEarnings: 2160,
    paymentStatus: 'Processing',
    invoiceId: 'INV-30071',
  },
  {
    id: 'sale-3255',
    crop: 'Tomatoes',
    farmerName: CURRENT_FARMER_NAME,
    buyer: 'Coastal Kitchens',
    buyerType: 'Restaurant',
    quantityKg: 500,
    saleDate: '2026-06-29',
    deliveryDate: '2026-06-30',
    sellingPrice: 2100,
    commission: 420,
    farmerEarnings: 1680,
    paymentStatus: 'Paid',
    invoiceId: 'INV-30044',
  },
  {
    id: 'sale-3241',
    crop: 'Onions',
    farmerName: 'Efua Sarpong',
    buyer: 'Highland Traders',
    buyerType: 'Wholesaler',
    quantityKg: 1800,
    saleDate: '2026-06-24',
    deliveryDate: '2026-06-26',
    sellingPrice: 8100,
    commission: 1620,
    farmerEarnings: 6480,
    paymentStatus: 'Paid',
    invoiceId: 'INV-30019',
  },
]

export const mockAdminPayouts: AdminPayoutRecord[] = [
  { id: 'pay-501', farmerName: CURRENT_FARMER_NAME, amount: 5200, requestedAt: '2026-07-24', completedAt: '2026-07-26', status: 'Paid', method: 'MTN Mobile Money' },
  { id: 'pay-497', farmerName: 'Yaw Mensah', amount: 3800, requestedAt: '2026-07-10', completedAt: '2026-07-12', status: 'Paid', method: 'GCB Bank' },
  { id: 'pay-512', farmerName: CURRENT_FARMER_NAME, amount: 2160, requestedAt: '2026-07-29', status: 'Approved', method: 'MTN Mobile Money' },
  { id: 'pay-515', farmerName: 'Abena Owusu', amount: 4100, requestedAt: '2026-07-29', status: 'Pending', method: 'Vodafone Cash' },
  { id: 'pay-489', farmerName: 'Efua Sarpong', amount: 4600, requestedAt: '2026-06-22', completedAt: '2026-06-25', status: 'Paid', method: 'GCB Bank' },
]

// ================= Activity log (canonical, shared) =================

export const mockActivityLog: ActivityEvent[] = [
  {
    id: 'act-0001',
    type: 'sale-completed',
    title: 'Sale Completed',
    description: '400kg of Carrots sold to Savanna Bistro for GHS 2,400.',
    createdAt: '2026-07-20T11:05:00Z',
    actor: 'admin',
  },
  {
    id: 'act-0002',
    type: 'payment-sent',
    title: 'Payment Sent',
    description: 'GHS 5,200 paid out to Kwame Asante via MTN Mobile Money.',
    createdAt: '2026-07-26T16:00:00Z',
    actor: 'admin',
  },
]

export function addActivity(type: ActivityType, title: string, description: string, actor: ActivityEvent['actor'] = 'admin') {
  const event: ActivityEvent = {
    id: generateId('act'),
    type,
    title,
    description,
    createdAt: new Date().toISOString(),
    actor,
  }
  mockActivityLog.unshift(event)
  return event
}

export function notifyFarmer(type: NotificationType, title: string, message: string) {
  const notification: NotificationItem = {
    id: generateId('ntf'),
    type,
    category: notificationCategoryByType[type],
    title,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  }
  mockFarmerNotifications.unshift(notification)
  return notification
}

// ================= Drivers (canonical) =================

export const mockDrivers: Driver[] = [
  {
    id: 'drv-01',
    name: 'Samuel Owusu',
    avatarInitials: 'SO',
    licenseNumber: 'DL-GH-88213',
    phone: '+233 24 112 8890',
    assignedVehiclePlate: 'GT 4521-24',
    todaysDeliveries: 2,
    completedDeliveries: 214,
    performanceRating: 4.8,
    availability: 'On Delivery',
  },
  {
    id: 'drv-02',
    name: 'Yaw Boateng',
    avatarInitials: 'YB',
    licenseNumber: 'DL-GH-77419',
    phone: '+233 20 887 3312',
    assignedVehiclePlate: 'GR 1187-23',
    todaysDeliveries: 1,
    completedDeliveries: 186,
    performanceRating: 4.6,
    availability: 'On Delivery',
  },
  {
    id: 'drv-03',
    name: 'Abdul Rahman',
    avatarInitials: 'AR',
    licenseNumber: 'DL-GH-90071',
    phone: '+233 27 445 1290',
    assignedVehiclePlate: 'GW 8823-22',
    todaysDeliveries: 0,
    completedDeliveries: 142,
    performanceRating: 4.4,
    availability: 'Available',
  },
  {
    id: 'drv-04',
    name: 'Emmanuel Tetteh',
    avatarInitials: 'ET',
    licenseNumber: 'DL-GH-65502',
    phone: '+233 55 220 7761',
    assignedVehiclePlate: 'GS 2290-24',
    todaysDeliveries: 0,
    completedDeliveries: 98,
    performanceRating: 4.1,
    availability: 'Off Duty',
  },
]

// ================= Audit log (canonical) =================

export const mockAuditLog: AuditLogEntry[] = [
  {
    id: 'aud-0001',
    user: CURRENT_ADMIN_NAME,
    action: 'Approved storage request',
    affectedRecord: 'str-2994 (Plantain, 700kg)',
    previousValue: 'Pending',
    newValue: 'Approved',
    timestamp: '2026-07-22T10:12:00Z',
  },
  {
    id: 'aud-0002',
    user: CURRENT_ADMIN_NAME,
    action: 'Processed payout',
    affectedRecord: 'pay-501 (Kwame Asante)',
    previousValue: 'Approved',
    newValue: 'Paid',
    timestamp: '2026-07-26T16:00:00Z',
  },
]

export function addAuditEntry(action: string, affectedRecord: string, previousValue?: string, newValue?: string) {
  const entry: AuditLogEntry = {
    id: generateId('aud'),
    user: CURRENT_ADMIN_NAME,
    action,
    affectedRecord,
    previousValue,
    newValue,
    timestamp: new Date().toISOString(),
  }
  mockAuditLog.unshift(entry)
  return entry
}
