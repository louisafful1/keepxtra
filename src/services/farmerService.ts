import type {
  FarmerDashboardStats,
  FarmerPaymentsSummary,
  FarmerProfile,
  NotificationItem,
  PickupRequest,
  ProduceRecord,
  SaleRecord,
  StorageRequestInput,
} from '@/types/farmer'
import {
  mockFarmerDashboardStats,
  mockFarmerNotifications,
  mockFarmerProfile,
  mockPaymentsSummary,
  mockPickupRequests,
  mockProduceRecords,
  mockSalesHistory,
} from '@/services/mock/farmerMockData'
import { simulateMutation, simulateRequest } from '@/services/simulateRequest'

async function getDashboardStats(): Promise<FarmerDashboardStats> {
  return simulateRequest(mockFarmerDashboardStats)
}

async function getProduceRecords(): Promise<ProduceRecord[]> {
  return simulateRequest(mockProduceRecords)
}

async function getPickupRequests(): Promise<PickupRequest[]> {
  return simulateRequest(mockPickupRequests)
}

async function submitStorageRequest(input: StorageRequestInput): Promise<PickupRequest> {
  const created: PickupRequest = {
    id: `pkp-${Math.floor(1000 + Math.random() * 9000)}`,
    crop: input.crop,
    quantityKg: input.quantityKg,
    pickupLocation: input.pickupLocation,
    preferredPickupDate: input.preferredPickupDate,
    status: 'Pending',
    notes: input.notes,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  mockPickupRequests.unshift(created)
  return simulateMutation(created)
}

async function getSalesHistory(): Promise<SaleRecord[]> {
  return simulateRequest(mockSalesHistory)
}

async function getPaymentsSummary(): Promise<FarmerPaymentsSummary> {
  return simulateRequest(mockPaymentsSummary)
}

async function requestPayout(amount: number): Promise<{ success: true; amount: number }> {
  mockPaymentsSummary.pendingPayments += amount
  mockPaymentsSummary.currentBalance = Math.max(0, mockPaymentsSummary.currentBalance - amount)
  mockPaymentsSummary.payoutHistory.unshift({
    id: `pay-${Math.floor(1000 + Math.random() * 9000)}`,
    amount,
    requestedAt: new Date().toISOString().slice(0, 10),
    status: 'Processing',
    method: mockFarmerProfile.preferredPayoutMethod,
  })
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

export const farmerService = {
  getDashboardStats,
  getProduceRecords,
  getPickupRequests,
  submitStorageRequest,
  getSalesHistory,
  getPaymentsSummary,
  requestPayout,
  getNotifications,
  markNotificationRead,
  getProfile,
  updateProfile,
  changePassword,
}
