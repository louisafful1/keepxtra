import type {
  FarmerAccount,
  FleetVehicle,
  OrderRecord,
  RevenueTrendPoint,
  SalesTrendPoint,
  StorageUtilizationPoint,
  WarehouseRecord,
} from '@/types/admin'
import { CURRENT_FARMER_NAME } from '@/services/mock/sharedMockData'

export const mockFarmerAccounts: FarmerAccount[] = [
  { id: 'far-001', name: CURRENT_FARMER_NAME, email: 'kwame.asante@example.com', phone: '+233 24 555 0187', farmLocation: 'Nsawam, Eastern Region', status: 'Active', joinedAt: '2025-11-02', totalProduceKg: 12400, totalEarnings: 46200 },
  { id: 'far-002', name: 'Abena Owusu', email: 'abena.owusu@example.com', phone: '+233 20 441 8890', farmLocation: 'Techiman, Bono East', status: 'Active', joinedAt: '2025-12-14', totalProduceKg: 9800, totalEarnings: 38100 },
  { id: 'far-003', name: 'Yaw Mensah', email: 'yaw.mensah@example.com', phone: '+233 27 663 2210', farmLocation: 'Kumasi, Ashanti', status: 'Active', joinedAt: '2026-01-08', totalProduceKg: 15600, totalEarnings: 52900 },
  { id: 'far-004', name: 'Adjoa Boateng', email: 'adjoa.boateng@example.com', phone: '+233 55 128 7734', farmLocation: 'Ho, Volta Region', status: 'Pending Review', joinedAt: '2026-07-20', totalProduceKg: 0, totalEarnings: 0 },
  { id: 'far-005', name: 'Kofi Danso', email: 'kofi.danso@example.com', phone: '+233 24 998 1123', farmLocation: 'Tamale, Northern Region', status: 'Suspended', joinedAt: '2025-09-30', totalProduceKg: 4200, totalEarnings: 15400 },
  { id: 'far-006', name: 'Efua Sarpong', email: 'efua.sarpong@example.com', phone: '+233 26 774 4402', farmLocation: 'Cape Coast, Central Region', status: 'Active', joinedAt: '2026-03-11', totalProduceKg: 7300, totalEarnings: 27600 },
]

export const mockWarehouses: WarehouseRecord[] = [
  {
    id: 'wh-01',
    name: 'Accra Cold Hub 1',
    code: 'ACC-01',
    address: '14 Harbour Road, Tema Industrial Area, Accra',
    location: 'Tema Industrial Area, Accra',
    coldRoomCapacityKg: 40000,
    currentOccupancyKg: 28600,
    temperatureC: 4.2,
    lastLoggedAt: '2026-07-30T07:00:00Z',
    coldRooms: [
      { id: 'cr-01a', name: 'Cold Room A', temperatureC: 4.0, capacityKg: 15000, occupancyKg: 11200, status: 'Operational', lastInspectionDate: '2026-07-20' },
      { id: 'cr-01b', name: 'Cold Room B', temperatureC: 4.4, capacityKg: 15000, occupancyKg: 9800, status: 'Operational', lastInspectionDate: '2026-07-18' },
      { id: 'cr-01c', name: 'Cold Room C', temperatureC: 5.1, capacityKg: 10000, occupancyKg: 7600, status: 'Under Maintenance', lastInspectionDate: '2026-07-05' },
    ],
  },
  {
    id: 'wh-02',
    name: 'Accra Cold Hub 2',
    code: 'ACC-02',
    address: '8 Kaneshie Link Road, North Kaneshie, Accra',
    location: 'North Kaneshie, Accra',
    coldRoomCapacityKg: 25000,
    currentOccupancyKg: 14200,
    temperatureC: 3.8,
    lastLoggedAt: '2026-07-30T07:00:00Z',
    coldRooms: [
      { id: 'cr-02a', name: 'Cold Room A', temperatureC: 3.6, capacityKg: 12000, occupancyKg: 7100, status: 'Operational', lastInspectionDate: '2026-07-22' },
      { id: 'cr-02b', name: 'Cold Room B', temperatureC: 4.0, capacityKg: 13000, occupancyKg: 7100, status: 'Operational', lastInspectionDate: '2026-07-22' },
    ],
  },
  {
    id: 'wh-03',
    name: 'Kumasi Cold Hub',
    code: 'KMS-01',
    address: '21 Asokwa Industrial Area, Kumasi',
    location: 'Asokwa, Kumasi',
    coldRoomCapacityKg: 35000,
    currentOccupancyKg: 27100,
    temperatureC: 4.5,
    lastLoggedAt: '2026-07-30T07:00:00Z',
    coldRooms: [
      { id: 'cr-03a', name: 'Cold Room A', temperatureC: 4.3, capacityKg: 18000, occupancyKg: 14200, status: 'Operational', lastInspectionDate: '2026-07-15' },
      { id: 'cr-03b', name: 'Cold Room B', temperatureC: 4.7, capacityKg: 17000, occupancyKg: 12900, status: 'Operational', lastInspectionDate: '2026-07-15' },
    ],
  },
  {
    id: 'wh-04',
    name: 'Cape Coast Hub',
    code: 'CPC-01',
    address: '3 Coastal Road, Cape Coast, Central Region',
    location: 'Cape Coast, Central Region',
    coldRoomCapacityKg: 18000,
    currentOccupancyKg: 14700,
    temperatureC: 4.0,
    lastLoggedAt: '2026-07-30T06:45:00Z',
    coldRooms: [
      { id: 'cr-04a', name: 'Cold Room A', temperatureC: 4.0, capacityKg: 18000, occupancyKg: 14700, status: 'Operational', lastInspectionDate: '2026-07-10' },
    ],
  },
]

export const mockFleet: FleetVehicle[] = [
  {
    id: 'flt-01',
    plate: 'GT 4521-24',
    registrationNumber: 'REG-GH-204518',
    type: 'Refrigerated Van',
    driverName: 'Samuel Owusu',
    status: 'On Route',
    currentAssignment: 'Pickup PKP-2201 · Plantain',
    fuelLevelPct: 72,
    lastMaintenanceAt: '2026-07-01',
    nextServiceDue: '2026-09-01',
    maintenanceStatus: 'Up to Date',
    healthScorePct: 92,
    mileageKm: 48200,
  },
  {
    id: 'flt-02',
    plate: 'GR 1187-23',
    registrationNumber: 'REG-GH-198802',
    type: 'Refrigerated Van',
    driverName: 'Yaw Boateng',
    status: 'On Route',
    currentAssignment: 'Pickup PKP-2198 · Tomatoes',
    fuelLevelPct: 45,
    lastMaintenanceAt: '2026-06-18',
    nextServiceDue: '2026-08-18',
    maintenanceStatus: 'Due Soon',
    healthScorePct: 78,
    mileageKm: 61500,
  },
  {
    id: 'flt-03',
    plate: 'GW 8823-22',
    registrationNumber: 'REG-GH-176623',
    type: 'Flatbed Truck',
    driverName: 'Abdul Rahman',
    status: 'Available',
    currentAssignment: 'Idle',
    fuelLevelPct: 90,
    lastMaintenanceAt: '2026-07-15',
    nextServiceDue: '2026-10-15',
    maintenanceStatus: 'Up to Date',
    healthScorePct: 96,
    mileageKm: 33800,
  },
  {
    id: 'flt-04',
    plate: 'GS 2290-24',
    registrationNumber: 'REG-GH-221190',
    type: 'Refrigerated Van',
    driverName: 'Emmanuel Tetteh',
    status: 'Maintenance',
    currentAssignment: 'In workshop',
    fuelLevelPct: 20,
    lastMaintenanceAt: '2026-07-28',
    nextServiceDue: '2026-07-31',
    maintenanceStatus: 'Overdue',
    healthScorePct: 54,
    mileageKm: 72100,
  },
]

export const mockOrders: OrderRecord[] = [
  { id: 'ord-9001', buyerName: 'Savanna Bistro', buyerType: 'Restaurant', items: 'Carrots, Tomatoes', totalValue: 4200, status: 'Delivered', orderedAt: '2026-07-25' },
  { id: 'ord-9004', buyerName: 'Baobab Hotels', buyerType: 'Hotel', items: 'Onions, Green Peppers', totalValue: 6800, status: 'Out for Delivery', orderedAt: '2026-07-29' },
  { id: 'ord-9006', buyerName: 'Metro Retail', buyerType: 'Retailer', items: 'Cassava, Plantain', totalValue: 5100, status: 'Confirmed', orderedAt: '2026-07-30' },
  { id: 'ord-9007', buyerName: 'Highland Traders', buyerType: 'Wholesaler', items: 'Onions', totalValue: 9200, status: 'Processing', orderedAt: '2026-07-30' },
  { id: 'ord-8998', buyerName: 'Coastal Kitchens', buyerType: 'Restaurant', items: 'Tomatoes, Cabbage', totalValue: 3100, status: 'Delivered', orderedAt: '2026-07-22' },
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

export const mockSalesTrend: SalesTrendPoint[] = [
  { label: 'Feb', unitsKg: 5200 },
  { label: 'Mar', unitsKg: 6100 },
  { label: 'Apr', unitsKg: 6800 },
  { label: 'May', unitsKg: 7400 },
  { label: 'Jun', unitsKg: 8100 },
  { label: 'Jul', unitsKg: 8450 },
]
