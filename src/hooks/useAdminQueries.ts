import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import type {
  CreateInspectionInput,
  CreateSaleInput,
  FarmerAccountStatus,
  WarehouseReceivingInput,
} from '@/types/admin'
import type { PickupStatus } from '@/types/farmer'

export const adminKeys = {
  dashboard: ['admin', 'dashboard'] as const,
  farmers: ['admin', 'farmers'] as const,
  storageRequests: ['admin', 'storage-requests'] as const,
  inventory: ['admin', 'inventory'] as const,
  warehouses: ['admin', 'warehouses'] as const,
  pickups: ['admin', 'pickups'] as const,
  fleet: ['admin', 'fleet'] as const,
  orders: ['admin', 'orders'] as const,
  sales: ['admin', 'sales'] as const,
  payouts: ['admin', 'payouts'] as const,
  inspections: ['admin', 'inspections'] as const,
  revenueTrend: ['admin', 'revenue-trend'] as const,
  storageUtilization: ['admin', 'storage-utilization'] as const,
  salesTrend: ['admin', 'sales-trend'] as const,
  activity: ['admin', 'activity'] as const,
  drivers: ['admin', 'drivers'] as const,
  auditLog: ['admin', 'audit-log'] as const,
}

function invalidateAdminCore(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: adminKeys.dashboard })
  queryClient.invalidateQueries({ queryKey: adminKeys.activity })
  queryClient.invalidateQueries({ queryKey: adminKeys.auditLog })
}

export function useAdminDashboard() {
  return useQuery({ queryKey: adminKeys.dashboard, queryFn: adminService.getDashboardStats })
}

export function useFarmerAccounts() {
  return useQuery({ queryKey: adminKeys.farmers, queryFn: adminService.getFarmers })
}

export function useAdminStorageRequests() {
  return useQuery({ queryKey: adminKeys.storageRequests, queryFn: adminService.getStorageRequests })
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

export function useInspections() {
  return useQuery({ queryKey: adminKeys.inspections, queryFn: adminService.getInspections })
}

export function useRevenueTrend() {
  return useQuery({ queryKey: adminKeys.revenueTrend, queryFn: adminService.getRevenueTrend })
}

export function useStorageUtilization() {
  return useQuery({ queryKey: adminKeys.storageUtilization, queryFn: adminService.getStorageUtilization })
}

export function useSalesTrend() {
  return useQuery({ queryKey: adminKeys.salesTrend, queryFn: adminService.getSalesTrend })
}

export function useAdminActivity() {
  return useQuery({ queryKey: adminKeys.activity, queryFn: adminService.getActivityTimeline })
}

export function useDrivers() {
  return useQuery({ queryKey: adminKeys.drivers, queryFn: adminService.getDrivers })
}

export function useAuditLog() {
  return useQuery({ queryKey: adminKeys.auditLog, queryFn: adminService.getAuditLog })
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

export function useApproveStorageRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.approveStorageRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.storageRequests })
      queryClient.invalidateQueries({ queryKey: adminKeys.pickups })
      invalidateAdminCore(queryClient)
    },
  })
}

export function useRejectStorageRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminService.rejectStorageRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.storageRequests })
      invalidateAdminCore(queryClient)
    },
  })
}

export function useRequestStorageInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => adminService.requestStorageInfo(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.storageRequests })
      invalidateAdminCore(queryClient)
    },
  })
}

export function useApprovePickupRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.approvePickupRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pickups })
      invalidateAdminCore(queryClient)
    },
  })
}

export function useUpdatePickupAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; driverName: string; vehiclePlate: string; pickupDate: string; notes?: string }) =>
      adminService.updatePickupAssignment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pickups })
      invalidateAdminCore(queryClient)
    },
  })
}

export function useAdvancePickupStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PickupStatus }) => adminService.advancePickupStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pickups })
      invalidateAdminCore(queryClient)
    },
  })
}

export function useReceiveAtWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: WarehouseReceivingInput) => adminService.receiveAtWarehouse(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pickups })
      queryClient.invalidateQueries({ queryKey: adminKeys.inventory })
      queryClient.invalidateQueries({ queryKey: adminKeys.warehouses })
      invalidateAdminCore(queryClient)
    },
  })
}

export function useCreateInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateInspectionInput) => adminService.createInspection(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.inspections })
      queryClient.invalidateQueries({ queryKey: adminKeys.inventory })
      invalidateAdminCore(queryClient)
    },
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSaleInput) => adminService.createSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.sales })
      queryClient.invalidateQueries({ queryKey: adminKeys.inventory })
      queryClient.invalidateQueries({ queryKey: adminKeys.farmers })
      invalidateAdminCore(queryClient)
    },
  })
}

export function useApprovePayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.approvePayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payouts })
      invalidateAdminCore(queryClient)
    },
  })
}

export function useRejectPayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminService.rejectPayout(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payouts })
      invalidateAdminCore(queryClient)
    },
  })
}

export function useProcessPayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.processPayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payouts })
      invalidateAdminCore(queryClient)
    },
  })
}
