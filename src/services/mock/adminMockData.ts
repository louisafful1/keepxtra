import type {
  AdminDashboardStats,
  AdminPayoutRecord,
  AdminPickupRequest,
  AdminSaleRecord,
  FarmerAccount,
  FleetVehicle,
  InventoryItem,
  OrderRecord,
  RevenueTrendPoint,
  StorageUtilizationPoint,
  WarehouseRecord,
} from '@/types/admin'

export const mockAdminDashboardStats: AdminDashboardStats = {
  registeredFarmers: 1247,
  produceInStorageKg: 84600,
  pendingPickups: 18,
  todaysDeliveries: 34,
  revenue: 286400,
  storageCapacityUsedPct: 68,
}

export const mockFarmerAccounts: FarmerAccount[] = [
  { id: 'far-001', name: 'Kwame Asante', email: 'kwame.asante@example.com', phone: '+233 24 555 0187', farmLocation: 'Nsawam, Eastern Region', status: 'Active', joinedAt: '2025-11-02', totalProduceKg: 12400, totalEarnings: 46200 },
  { id: 'far-002', name: 'Abena Owusu', email: 'abena.owusu@example.com', phone: '+233 20 441 8890', farmLocation: 'Techiman, Bono East', status: 'Active', joinedAt: '2025-12-14', totalProduceKg: 9800, totalEarnings: 38100 },
  { id: 'far-003', name: 'Yaw Mensah', email: 'yaw.mensah@example.com', phone: '+233 27 663 2210', farmLocation: 'Kumasi, Ashanti', status: 'Active', joinedAt: '2026-01-08', totalProduceKg: 15600, totalEarnings: 52900 },
  { id: 'far-004', name: 'Adjoa Boateng', email: 'adjoa.boateng@example.com', phone: '+233 55 128 7734', farmLocation: 'Ho, Volta Region', status: 'Pending Review', joinedAt: '2026-07-20', totalProduceKg: 0, totalEarnings: 0 },
  { id: 'far-005', name: 'Kofi Danso', email: 'kofi.danso@example.com', phone: '+233 24 998 1123', farmLocation: 'Tamale, Northern Region', status: 'Suspended', joinedAt: '2025-09-30', totalProduceKg: 4200, totalEarnings: 15400 },
  { id: 'far-006', name: 'Efua Sarpong', email: 'efua.sarpong@example.com', phone: '+233 26 774 4402', farmLocation: 'Cape Coast, Central Region', status: 'Active', joinedAt: '2026-03-11', totalProduceKg: 7300, totalEarnings: 27600 },
]

export const mockInventory: InventoryItem[] = [
  { id: 'inv-01', crop: 'Tomatoes', farmerName: 'Kwame Asante', quantityKg: 850, grade: 'A', warehouse: 'Accra Cold Hub 1', expiryDate: '2026-08-12', status: 'In Storage' },
  { id: 'inv-02', crop: 'Onions', farmerName: 'Yaw Mensah', quantityKg: 3400, grade: 'B', warehouse: 'Kumasi Cold Hub', expiryDate: '2026-09-01', status: 'In Storage' },
  { id: 'inv-03', crop: 'Green Peppers', farmerName: 'Abena Owusu', quantityKg: 620, grade: 'A', warehouse: 'Accra Cold Hub 1', expiryDate: '2026-08-05', status: 'Reserved' },
  { id: 'inv-04', crop: 'Cabbage', farmerName: 'Kwame Asante', quantityKg: 550, grade: 'A', warehouse: 'Accra Cold Hub 2', expiryDate: '2026-08-14', status: 'In Storage' },
  { id: 'inv-05', crop: 'Plantain', farmerName: 'Efua Sarpong', quantityKg: 1100, grade: 'B', warehouse: 'Cape Coast Hub', expiryDate: '2026-08-20', status: 'In Storage' },
  { id: 'inv-06', crop: 'Carrots', farmerName: 'Kwame Asante', quantityKg: 400, grade: 'B', warehouse: 'Accra Cold Hub 1', expiryDate: '2026-07-25', status: 'Sold' },
]

export const mockWarehouses: WarehouseRecord[] = [
  { id: 'wh-01', name: 'Accra Cold Hub 1', location: 'Tema Industrial Area, Accra', coldRoomCapacityKg: 40000, currentOccupancyKg: 28600, temperatureC: 4.2, lastLoggedAt: '2026-07-30T07:00:00Z' },
  { id: 'wh-02', name: 'Accra Cold Hub 2', location: 'North Kaneshie, Accra', coldRoomCapacityKg: 25000, currentOccupancyKg: 14200, temperatureC: 3.8, lastLoggedAt: '2026-07-30T07:00:00Z' },
  { id: 'wh-03', name: 'Kumasi Cold Hub', location: 'Asokwa, Kumasi', coldRoomCapacityKg: 35000, currentOccupancyKg: 27100, temperatureC: 4.5, lastLoggedAt: '2026-07-30T07:00:00Z' },
  { id: 'wh-04', name: 'Cape Coast Hub', location: 'Cape Coast, Central Region', coldRoomCapacityKg: 18000, currentOccupancyKg: 14700, temperatureC: 4.0, lastLoggedAt: '2026-07-30T06:45:00Z' },
]

export const mockAdminPickupRequests: AdminPickupRequest[] = [
  { id: 'pkp-2201', farmerName: 'Kwame Asante', crop: 'Plantain', quantityKg: 700, pickupLocation: 'Nsawam Farm Gate', preferredPickupDate: '2026-08-05', status: 'Vehicle Assigned', driverName: 'Samuel Owusu', vehiclePlate: 'GT 4521-24' },
  { id: 'pkp-2199', farmerName: 'Yaw Mensah', crop: 'Onions', quantityKg: 1800, pickupLocation: 'Kumasi Farm Gate', preferredPickupDate: '2026-08-03', status: 'Pending' },
  { id: 'pkp-2198', farmerName: 'Kwame Asante', crop: 'Tomatoes', quantityKg: 300, pickupLocation: 'Nsawam Farm Gate', preferredPickupDate: '2026-08-02', status: 'Driver En Route', driverName: 'Yaw Boateng', vehiclePlate: 'GR 1187-23' },
  { id: 'pkp-2196', farmerName: 'Efua Sarpong', crop: 'Plantain', quantityKg: 1100, pickupLocation: 'Cape Coast Farm Gate', preferredPickupDate: '2026-08-01', status: 'Approved' },
  { id: 'pkp-2190', farmerName: 'Kwame Asante', crop: 'Cassava', quantityKg: 900, pickupLocation: 'Nsawam Farm Gate', preferredPickupDate: '2026-07-22', status: 'Delivered to Warehouse', driverName: 'Samuel Owusu', vehiclePlate: 'GT 4521-24' },
]

export const mockFleet: FleetVehicle[] = [
  { id: 'flt-01', plate: 'GT 4521-24', type: 'Refrigerated Van', driverName: 'Samuel Owusu', status: 'On Route', fuelLevelPct: 72, lastMaintenanceAt: '2026-07-01', mileageKm: 48200 },
  { id: 'flt-02', plate: 'GR 1187-23', type: 'Refrigerated Van', driverName: 'Yaw Boateng', status: 'On Route', fuelLevelPct: 45, lastMaintenanceAt: '2026-06-18', mileageKm: 61500 },
  { id: 'flt-03', plate: 'GW 8823-22', type: 'Flatbed Truck', driverName: 'Abdul Rahman', status: 'Available', fuelLevelPct: 90, lastMaintenanceAt: '2026-07-15', mileageKm: 33800 },
  { id: 'flt-04', plate: 'GS 2290-24', type: 'Refrigerated Van', driverName: 'Emmanuel Tetteh', status: 'Maintenance', fuelLevelPct: 20, lastMaintenanceAt: '2026-07-28', mileageKm: 72100 },
]

export const mockOrders: OrderRecord[] = [
  { id: 'ord-9001', buyerName: 'Savanna Bistro', buyerType: 'Restaurant', items: 'Carrots, Tomatoes', totalValue: 4200, status: 'Delivered', orderedAt: '2026-07-25' },
  { id: 'ord-9004', buyerName: 'Baobab Hotels', buyerType: 'Hotel', items: 'Onions, Green Peppers', totalValue: 6800, status: 'Out for Delivery', orderedAt: '2026-07-29' },
  { id: 'ord-9006', buyerName: 'Metro Retail', buyerType: 'Retailer', items: 'Cassava, Plantain', totalValue: 5100, status: 'Confirmed', orderedAt: '2026-07-30' },
  { id: 'ord-9007', buyerName: 'Highland Traders', buyerType: 'Wholesaler', items: 'Onions', totalValue: 9200, status: 'Processing', orderedAt: '2026-07-30' },
  { id: 'ord-8998', buyerName: 'Coastal Kitchens', buyerType: 'Restaurant', items: 'Tomatoes, Cabbage', totalValue: 3100, status: 'Delivered', orderedAt: '2026-07-22' },
]

export const mockAdminSales: AdminSaleRecord[] = [
  { id: 'sale-3301', crop: 'Carrots', buyer: 'Savanna Bistro', buyerType: 'Restaurant', quantityKg: 400, saleDate: '2026-07-20', sellingPrice: 2400, commission: 480, invoiceId: 'INV-30112' },
  { id: 'sale-3287', crop: 'Cassava', buyer: 'Metro Retail', buyerType: 'Retailer', quantityKg: 900, saleDate: '2026-07-15', sellingPrice: 3150, commission: 630, invoiceId: 'INV-30098' },
  { id: 'sale-3270', crop: 'Onions', buyer: 'Baobab Hotels', buyerType: 'Hotel', quantityKg: 600, saleDate: '2026-07-08', sellingPrice: 2700, commission: 540, invoiceId: 'INV-30071' },
  { id: 'sale-3255', crop: 'Tomatoes', buyer: 'Coastal Kitchens', buyerType: 'Restaurant', quantityKg: 500, saleDate: '2026-06-29', sellingPrice: 2100, commission: 420, invoiceId: 'INV-30044' },
  { id: 'sale-3241', crop: 'Onions', buyer: 'Highland Traders', buyerType: 'Wholesaler', quantityKg: 1800, saleDate: '2026-06-24', sellingPrice: 8100, commission: 1620, invoiceId: 'INV-30019' },
]

export const mockAdminPayouts: AdminPayoutRecord[] = [
  { id: 'pay-501', farmerName: 'Kwame Asante', amount: 5200, requestedAt: '2026-07-24', status: 'Paid', method: 'MTN Mobile Money' },
  { id: 'pay-497', farmerName: 'Yaw Mensah', amount: 3800, requestedAt: '2026-07-10', status: 'Paid', method: 'GCB Bank' },
  { id: 'pay-512', farmerName: 'Kwame Asante', amount: 2160, requestedAt: '2026-07-29', status: 'Processing', method: 'MTN Mobile Money' },
  { id: 'pay-515', farmerName: 'Abena Owusu', amount: 4100, requestedAt: '2026-07-29', status: 'Pending', method: 'Vodafone Cash' },
  { id: 'pay-489', farmerName: 'Efua Sarpong', amount: 4600, requestedAt: '2026-06-22', status: 'Paid', method: 'GCB Bank' },
]

export const mockRevenueTrend: RevenueTrendPoint[] = [
  { label: 'Feb', revenue: 168000, storageFees: 21000 },
  { label: 'Mar', revenue: 182000, storageFees: 23400 },
  { label: 'Apr', revenue: 201000, storageFees: 25100 },
  { label: 'May', revenue: 219000, storageFees: 27800 },
  { label: 'Jun', revenue: 248000, storageFees: 30200 },
  { label: 'Jul', revenue: 286400, storageFees: 34600 },
]

export const mockStorageUtilization: StorageUtilizationPoint[] = [
  { warehouse: 'Accra Hub 1', usedPct: 72 },
  { warehouse: 'Accra Hub 2', usedPct: 57 },
  { warehouse: 'Kumasi Hub', usedPct: 77 },
  { warehouse: 'Cape Coast Hub', usedPct: 82 },
]
