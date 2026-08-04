import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { farmerService } from '@/services/farmerService'
import type { StorageRequestInput } from '@/types/farmer'

export const farmerKeys = {
  dashboard: ['farmer', 'dashboard'] as const,
  produce: ['farmer', 'produce'] as const,
  storageRequests: ['farmer', 'storage-requests'] as const,
  pickups: ['farmer', 'pickups'] as const,
  sales: ['farmer', 'sales'] as const,
  payments: ['farmer', 'payments'] as const,
  notifications: ['farmer', 'notifications'] as const,
  profile: ['farmer', 'profile'] as const,
  activity: ['farmer', 'activity'] as const,
}

function invalidateFarmerCore(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: farmerKeys.dashboard })
  queryClient.invalidateQueries({ queryKey: farmerKeys.activity })
  queryClient.invalidateQueries({ queryKey: farmerKeys.notifications })
}

export function useFarmerDashboard() {
  return useQuery({ queryKey: farmerKeys.dashboard, queryFn: farmerService.getDashboardStats })
}

export function useProduceRecords() {
  return useQuery({ queryKey: farmerKeys.produce, queryFn: farmerService.getProduceRecords })
}

export function useFarmerStorageRequests() {
  return useQuery({ queryKey: farmerKeys.storageRequests, queryFn: farmerService.getStorageRequests })
}

export function usePickupRequests() {
  return useQuery({ queryKey: farmerKeys.pickups, queryFn: farmerService.getPickupRequests })
}

export function useSalesHistory() {
  return useQuery({ queryKey: farmerKeys.sales, queryFn: farmerService.getSalesHistory })
}

export function usePaymentsSummary() {
  return useQuery({ queryKey: farmerKeys.payments, queryFn: farmerService.getPaymentsSummary })
}

export function useFarmerNotifications() {
  return useQuery({ queryKey: farmerKeys.notifications, queryFn: farmerService.getNotifications })
}

export function useFarmerProfile() {
  return useQuery({ queryKey: farmerKeys.profile, queryFn: farmerService.getProfile })
}

export function useFarmerActivity() {
  return useQuery({ queryKey: farmerKeys.activity, queryFn: farmerService.getActivityTimeline })
}

export function useSubmitStorageRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: StorageRequestInput) => farmerService.submitStorageRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmerKeys.storageRequests })
      invalidateFarmerCore(queryClient)
    },
  })
}

export function useRequestPayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (amount: number) => farmerService.requestPayout(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmerKeys.payments })
      invalidateFarmerCore(queryClient)
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => farmerService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmerKeys.notifications })
      queryClient.invalidateQueries({ queryKey: farmerKeys.dashboard })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => farmerService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmerKeys.notifications })
      queryClient.invalidateQueries({ queryKey: farmerKeys.dashboard })
    },
  })
}

export function useUpdateFarmerProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: farmerService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmerKeys.profile })
    },
  })
}
