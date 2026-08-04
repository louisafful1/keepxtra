import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import type { FarmerAccountStatus } from '@/types/admin'

export const adminKeys = {
  dashboard: ['admin', 'dashboard'] as const,
  farmers: ['admin', 'farmers'] as const,
  inventory: ['admin', 'inventory'] as const,
  warehouses: ['admin', 'warehouses'] as const,
  pickups: ['admin', 'pickups'] as const,
  fleet: ['admin', 'fleet'] as const,
  orders: ['admin', 'orders'] as const,
  sales: ['admin', 'sales'] as const,
  payouts: ['admin', 'payouts'] as const,
  revenueTrend: ['admin', 'revenue-trend'] as const,
  storageUtilization: ['admin', 'storage-utilization'] as const,
}

export function useAdminDashboard() {
  return useQuery({ queryKey: adminKeys.dashboard, queryFn: adminService.getDashboardStats })
}

export function useFarmerAccounts() {
  return useQuery({ queryKey: adminKeys.farmers, queryFn: adminService.getFarmers })
}

export function useInventory() {
  return useQuery({ queryKey: adminKeys.inventory, queryFn: adminService.getInventory })
}

export function useWarehouses() {
  return useQuery({ queryKey: adminKeys.warehouses, queryFn: adminService.getWarehouses })
}

export function useAdminPickupRequests() {
  return useQuery({ queryKey: adminKeys.pickups, queryFn: adminService.getPickupRequests })
}

export function useFleet() {
  return useQuery({ queryKey: adminKeys.fleet, queryFn: adminService.getFleet })
}

export function useOrders() {
  return useQuery({ queryKey: adminKeys.orders, queryFn: adminService.getOrders })
}

export function useAdminSales() {
  return useQuery({ queryKey: adminKeys.sales, queryFn: adminService.getSales })
}

export function useAdminPayouts() {
  return useQuery({ queryKey: adminKeys.payouts, queryFn: adminService.getPayouts })
}

export function useRevenueTrend() {
  return useQuery({ queryKey: adminKeys.revenueTrend, queryFn: adminService.getRevenueTrend })
}

export function useStorageUtilization() {
  return useQuery({ queryKey: adminKeys.storageUtilization, queryFn: adminService.getStorageUtilization })
}

export function useRegisterFarmer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminService.registerFarmer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.farmers })
    },
  })
}

export function useUpdateFarmerStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FarmerAccountStatus }) => adminService.updateFarmerStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.farmers })
    },
  })
}

export function useApprovePickupRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.approvePickupRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pickups })
    },
  })
}

export function useAssignDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, driverName, vehiclePlate }: { id: string; driverName: string; vehiclePlate: string }) =>
      adminService.assignDriver(id, driverName, vehiclePlate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pickups })
    },
  })
}

export function useProcessPayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.processPayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payouts })
    },
  })
}
