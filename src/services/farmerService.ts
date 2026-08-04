import type {
  FarmerDashboardStats,
  FarmerPaymentsSummary,
  FarmerProfile,
  NotificationItem,
  PayoutRecord,
  PickupRequest,
  ProduceRecord,
  SaleRecord,
  StorageRequest,
  StorageRequestInput,
} from '@/types/farmer'
import type { ActivityEvent } from '@/types/activity'
import { mockFarmerNotifications, mockFarmerProfile } from '@/services/mock/farmerMockData'
import {
  CURRENT_FARMER_NAME,
  addActivity,
  generateId,
  mockActivityLog,
  mockAdminPayouts,
  mockAdminSales,
  mockInventoryItems,
  mockPickups,
  mockStorageRequests,
} from '@/services/mock/sharedMockData'
import { simulateMutation, simulateRequest } from '@/services/simulateRequest'

const STORAGE_RATE_PER_KG = 0.2

function computeBalance() {
  const totalEarned = mockAdminSales
    .filter((s) => s.farmerName === CURRENT_FARMER_NAME && s.paymentStatus === 'Paid')
    .reduce((sum, s) => sum + s.farmerEarnings, 0)
  const totalPaidOut = mockAdminPayouts
    .filter((p) => p.farmerName === CURRENT_FARMER_NAME && p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingPayments = mockAdminPayouts
    .filter((p) => p.farmerName === CURRENT_FARMER_NAME && (p.status === 'Pending' || p.status === 'Approved'))
    .reduce((sum, p) => sum + p.amount, 0)

  return { currentBalance: Math.max(0, totalEarned - totalPaidOut - pendingPayments), totalPaidOut, pendingPayments }
}

async function getDashboardStats(): Promise<FarmerDashboardStats> {
  const produceInStorageKg = mockInventoryItems
    .filter((i) => i.farmerName === CURRENT_FARMER_NAME && i.status === 'In Storage')
    .reduce((sum, i) => sum + i.quantityKg, 0)

  const pendingPickupRequests = mockPickups.filter(
    (p) => p.farmerName === CURRENT_FARMER_NAME && p.status !== 'Completed',
  ).length

  const produceSoldKg = mockAdminSales
    .filter((s) => s.farmerName === CURRENT_FARMER_NAME)
    .reduce((sum, s) => sum + s.quantityKg, 0)

  const { currentBalance, pendingPayments } = computeBalance()

  const stats: FarmerDashboardStats = {
    produceInStorageKg,
    pendingPickupRequests,
    produceSoldKg,
    currentEarnings: currentBalance,
    pendingPayments,
    storageCharges: Math.round(produceInStorageKg * STORAGE_RATE_PER_KG),
    unreadNotifications: mockFarmerNotifications.filter((n) => !n.read).length,
  }

  return simulateRequest(stats)
}

async function getProduceRecords(): Promise<ProduceRecord[]> {
  const records: ProduceRecord[] = mockInventoryItems
    .filter((i) => i.farmerName === CURRENT_FARMER_NAME)
    .map((i) => ({
      id: i.id,
      crop: i.crop,
      quantityKg: i.quantityKg,
      grade: i.grade,
      warehouseLocation: i.warehouse,
      dateStored: i.storageDate,
      estimatedShelfLifeDays: i.shelfLifeDays,
      status: i.status,
    }))
  return simulateRequest(records)
}

async function getStorageRequests(): Promise<StorageRequest[]> {
  return simulateRequest(mockStorageRequests.filter((r) => r.farmerName === CURRENT_FARMER_NAME))
}

async function submitStorageRequest(input: StorageRequestInput): Promise<StorageRequest> {
  const created = {
    id: generateId('str'),
    farmerName: CURRENT_FARMER_NAME,
    crop: input.crop,
    quantityKg: input.quantityKg,
    harvestDate: input.harvestDate,
    pickupLocation: input.pickupLocation,
    preferredPickupDate: input.preferredPickupDate,
    notes: input.notes,
    status: 'Pending' as const,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  mockStorageRequests.unshift(created)
  addActivity('storage-request-created', 'Storage Request Created', `${input.crop} (${input.quantityKg}kg) submitted for storage review.`, 'farmer')
  return simulateMutation(created)
}

async function getPickupRequests(): Promise<PickupRequest[]> {
  return simulateRequest(mockPickups.filter((p) => p.farmerName === CURRENT_FARMER_NAME))
}

async function getSalesHistory(): Promise<SaleRecord[]> {
  return simulateRequest(mockAdminSales.filter((s) => s.farmerName === CURRENT_FARMER_NAME))
}

async function getPaymentsSummary(): Promise<FarmerPaymentsSummary> {
  const { currentBalance, totalPaidOut, pendingPayments } = computeBalance()
  const payoutHistory: PayoutRecord[] = mockAdminPayouts
    .filter((p) => p.farmerName === CURRENT_FARMER_NAME)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))

  return simulateRequest({ currentBalance, pendingPayments, totalPaidOut, payoutHistory })
}

async function requestPayout(amount: number): Promise<{ success: true; amount: number }> {
  const payout = {
    id: generateId('pay'),
    farmerName: CURRENT_FARMER_NAME,
    amount,
    requestedAt: new Date().toISOString().slice(0, 10),
    status: 'Pending' as const,
    method: mockFarmerProfile.preferredPayoutMethod,
  }
  mockAdminPayouts.unshift(payout)
  addActivity('payment-requested', 'Payout Requested', `Requested a payout of GHS ${amount.toLocaleString()}.`, 'farmer')
  return simulateMutation({ success: true, amount })
}

async function getNotifications(): Promise<NotificationItem[]> {
  return simulateRequest(mockFarmerNotifications)
}

async function markNotificationRead(id: string): Promise<{ id: string }> {
  const notification = mockFarmerNotifications.find((n) => n.id === id)
  if (notification) notification.read = true
  return simulateMutation({ id }, 200)
}

async function markAllNotificationsRead(): Promise<{ success: true }> {
  mockFarmerNotifications.forEach((n) => {
    n.read = true
  })
  return simulateMutation({ success: true }, 200)
}

async function getProfile(): Promise<FarmerProfile> {
  return simulateRequest(mockFarmerProfile)
}

async function updateProfile(profile: FarmerProfile): Promise<FarmerProfile> {
  Object.assign(mockFarmerProfile, profile)
  return simulateMutation(profile)
}

async function changePassword(_current: string, _next: string): Promise<{ success: true }> {
  return simulateMutation({ success: true })
}

async function getActivityTimeline(): Promise<ActivityEvent[]> {
  return simulateRequest(mockActivityLog.slice(0, 12))
}

export const farmerService = {
  getDashboardStats,
  getProduceRecords,
  getStorageRequests,
  submitStorageRequest,
  getPickupRequests,
  getSalesHistory,
  getPaymentsSummary,
  requestPayout,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getProfile,
  updateProfile,
  changePassword,
  getActivityTimeline,
}
