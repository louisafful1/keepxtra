import { Role, type IRole } from '../../src/models/role.model'
import { Permission, type IPermission } from '../../src/models/permission.model'
import { User, type IUser } from '../../src/models/user.model'
import { Farmer, type IFarmer } from '../../src/models/farmer.model'
import { StorageRequest, type IStorageRequest } from '../../src/models/storageRequest.model'
import { Pickup, type IPickup } from '../../src/models/pickup.model'
import { Warehouse, type IWarehouse } from '../../src/models/warehouse.model'
import { ColdRoom, type IColdRoom } from '../../src/models/coldRoom.model'
import { Inventory, type IInventory } from '../../src/models/inventory.model'
import { QualityInspection, type IQualityInspection } from '../../src/models/qualityInspection.model'
import { Vehicle, type IVehicle } from '../../src/models/vehicle.model'
import { Driver, type IDriver } from '../../src/models/driver.model'
import { Customer, type ICustomer } from '../../src/models/customer.model'
import { Order, type IOrder, type IOrderItem } from '../../src/models/order.model'
import { Payout, type IPayout } from '../../src/models/payout.model'
import { Notification, type INotification } from '../../src/models/notification.model'
import { NotificationPreference, type INotificationPreference } from '../../src/models/notificationPreference.model'
import { hashPassword } from '../../src/utils/password'

/**
 * Minimal test data builders for the foundation models. Every field has a
 * sensible default so a test only has to override what it actually cares
 * about — e.g. `createTestRole({ permissions: [perm._id] })`.
 */

let counter = 0
function unique(prefix: string) {
  counter += 1
  return `${prefix}-${counter}`
}

export async function createTestPermission(overrides: Partial<IPermission> = {}): Promise<IPermission> {
  return Permission.create({
    key: overrides.key ?? unique('test.permission'),
    module: overrides.module ?? 'Test',
    description: overrides.description ?? 'A test permission',
    ...overrides,
  })
}

export async function createTestRole(overrides: Partial<IRole> = {}): Promise<IRole> {
  return Role.create({
    name: overrides.name ?? unique('Test Role'),
    scope: overrides.scope ?? 'operations',
    description: overrides.description ?? 'A test role',
    permissions: overrides.permissions ?? [],
    isSystem: overrides.isSystem ?? false,
    ...overrides,
  })
}

export async function createTestUser(overrides: Partial<IUser> & { roleId?: IUser['roleId'] } = {}): Promise<IUser> {
  const roleId = overrides.roleId ?? (await createTestRole())._id

  return User.create({
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `${unique('test-user')}@example.com`,
    passwordHash: overrides.passwordHash ?? 'not-a-real-hash',
    roleId,
    avatarInitials: overrides.avatarInitials ?? 'TU',
    phone: overrides.phone ?? '+233 24 000 0000',
    status: overrides.status ?? 'Active',
    ...overrides,
  })
}

/** The plaintext password every `createActiveUser()` account is set up with, unless overridden. */
export const DEFAULT_TEST_PASSWORD = 'Password123'

/**
 * A ready-to-log-in account: Active, email verified, real bcrypt hash for
 * `DEFAULT_TEST_PASSWORD` (or `overrides.password` if given), with a role
 * carrying the given permission keys. This is what every auth integration
 * test should build on rather than poking at `createTestUser` directly.
 */
export async function createActiveUser(
  overrides: Partial<IUser> & { roleId?: IUser['roleId']; password?: string; permissionKeys?: string[] } = {},
): Promise<{ user: IUser; password: string }> {
  const password = overrides.password ?? DEFAULT_TEST_PASSWORD
  const passwordHash = await hashPassword(password)

  let roleId = overrides.roleId
  if (!roleId) {
    const permissionDocs = await Promise.all((overrides.permissionKeys ?? []).map((key) => createTestPermission({ key })))
    roleId = (await createTestRole({ permissions: permissionDocs.map((p) => p._id) }))._id
  }

  // `?? new Date()` would incorrectly override an explicit `emailVerifiedAt: null`
  // (used by tests to build an unverified account) — only default when the
  // key was omitted entirely.
  const emailVerifiedAt = 'emailVerifiedAt' in overrides ? overrides.emailVerifiedAt : new Date()

  const user = await createTestUser({
    ...overrides,
    roleId,
    passwordHash,
    status: overrides.status ?? 'Active',
    emailVerifiedAt,
  })

  return { user, password }
}

/**
 * Creates a Farmer document directly (bypassing `FarmerService.register`,
 * so no email is sent and no linked User is auto-created unless one isn't
 * supplied) — for tests that need an existing farmer to read/update/
 * delete/restore/search rather than exercising registration itself.
 */
export async function createFarmerRecord(
  overrides: Partial<IFarmer> & { userId?: IFarmer['userId'] } = {},
): Promise<{ farmer: IFarmer; user: IUser }> {
  let userId = overrides.userId
  let user: IUser

  if (userId) {
    const existing = await User.findById(userId).exec()
    if (!existing) throw new Error('createFarmerRecord: overrides.userId does not reference an existing user')
    user = existing
  } else {
    const role = await createTestRole({ name: unique('Farmer Role'), scope: 'farmer', permissions: [] })
    ;({ user } = await createActiveUser({ roleId: role._id }))
    userId = user._id
  }

  const farmer = await Farmer.create({
    userId,
    farmerNumber: overrides.farmerNumber ?? unique('FRM'),
    firstName: overrides.firstName ?? 'Ama',
    lastName: overrides.lastName ?? 'Owusu',
    phone: overrides.phone ?? `+233 20 ${String(counter).padStart(3, '0')} 0000`,
    alternativePhone: overrides.alternativePhone ?? null,
    email: overrides.email ?? user.email,
    nationalId: overrides.nationalId ?? null,
    farmName: overrides.farmName ?? 'Owusu Farms',
    farmLocation: overrides.farmLocation ?? 'Techiman Farm Gate',
    district: overrides.district ?? 'Techiman North',
    region: overrides.region ?? 'Bono East',
    gpsCoordinates: overrides.gpsCoordinates ?? null,
    primaryCrops: overrides.primaryCrops ?? ['Maize'],
    preferredPickupDays: overrides.preferredPickupDays ?? [],
    preferredPaymentMethod: overrides.preferredPaymentMethod ?? 'Mobile Money',
    bankDetails: overrides.bankDetails ?? null,
    mobileMoneyDetails: overrides.mobileMoneyDetails ?? { provider: 'MTN', phoneNumber: '+233 20 000 0000' },
    status: overrides.status ?? 'Active',
    notes: overrides.notes ?? null,
  })

  return { farmer, user }
}

/**
 * Creates a StorageRequest document directly (bypassing
 * `StorageRequestService.create`) — for tests that need an existing request
 * to read/list/transition rather than exercising creation itself. Defaults
 * to a harvest date 3 days ago and a preferred pickup date 2 days from now
 * (both valid per the validators' rules) in `Draft` status.
 */
export async function createStorageRequestRecord(
  overrides: Partial<IStorageRequest> & { farmerId?: IStorageRequest['farmerId'] } = {},
): Promise<{ request: IStorageRequest; farmer: IFarmer; user: IUser }> {
  let farmer: IFarmer
  let user: IUser

  if (overrides.farmerId) {
    const existingFarmer = await Farmer.findById(overrides.farmerId).exec()
    if (!existingFarmer) throw new Error('createStorageRequestRecord: overrides.farmerId does not reference an existing farmer')
    farmer = existingFarmer
    const existingUser = await User.findById(farmer.userId).exec()
    if (!existingUser) throw new Error('createStorageRequestRecord: farmer.userId does not reference an existing user')
    user = existingUser
  } else {
    ;({ farmer, user } = await createFarmerRecord())
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

  const request = await StorageRequest.create({
    requestNumber: overrides.requestNumber ?? unique('SR'),
    farmerId: farmer._id,
    farmerName: overrides.farmerName ?? `${farmer.firstName} ${farmer.lastName}`,
    farmerNumber: overrides.farmerNumber ?? farmer.farmerNumber,
    district: overrides.district ?? farmer.district,
    region: overrides.region ?? farmer.region,
    produceType: overrides.produceType ?? 'Maize',
    quantity: overrides.quantity ?? 500,
    unit: overrides.unit ?? 'kg',
    estimatedWeightKg: overrides.estimatedWeightKg ?? 500,
    harvestDate: overrides.harvestDate ?? threeDaysAgo,
    pickupLocation: overrides.pickupLocation ?? 'Farm Gate',
    gpsCoordinates: overrides.gpsCoordinates ?? null,
    preferredPickupDate: overrides.preferredPickupDate ?? twoDaysFromNow,
    preferredPickupTime: overrides.preferredPickupTime ?? '08:00',
    specialInstructions: overrides.specialInstructions ?? null,
    photos: overrides.photos ?? [],
    status: overrides.status ?? 'Draft',
    requestedAt: overrides.requestedAt ?? null,
    priority: overrides.priority ?? 'Normal',
    internalNotes: overrides.internalNotes ?? null,
  })

  return { request, farmer, user }
}

/**
 * Creates a Pickup document directly (bypassing the auto-create event
 * listener), denormalizing from a linked StorageRequest exactly like the
 * real listener does. Defaults to a fresh `Approved` storage request and
 * `Pending` pickup status when no `storageRequestId` is given.
 */
export async function createPickupRecord(
  overrides: Partial<IPickup> & { storageRequestId?: IPickup['storageRequestId'] } = {},
): Promise<{ pickup: IPickup; request: IStorageRequest; farmer: IFarmer; user: IUser }> {
  let request: IStorageRequest
  let farmer: IFarmer
  let user: IUser

  if (overrides.storageRequestId) {
    const existing = await StorageRequest.findById(overrides.storageRequestId).exec()
    if (!existing) throw new Error('createPickupRecord: overrides.storageRequestId does not reference an existing storage request')
    request = existing
    const existingFarmer = await Farmer.findById(request.farmerId).exec()
    if (!existingFarmer) throw new Error('createPickupRecord: storage request farmerId does not reference an existing farmer')
    farmer = existingFarmer
    const existingUser = await User.findById(farmer.userId).exec()
    if (!existingUser) throw new Error('createPickupRecord: farmer.userId does not reference an existing user')
    user = existingUser
  } else {
    ;({ request, farmer, user } = await createStorageRequestRecord({ status: 'Approved' }))
  }

  const pickup = await Pickup.create({
    pickupNumber: overrides.pickupNumber ?? unique('PU'),
    storageRequestId: request._id,
    requestNumber: overrides.requestNumber ?? request.requestNumber,
    farmerId: request.farmerId,
    farmerName: overrides.farmerName ?? request.farmerName,
    farmerNumber: overrides.farmerNumber ?? request.farmerNumber,
    district: overrides.district ?? request.district,
    region: overrides.region ?? request.region,
    produceType: overrides.produceType ?? request.produceType,
    quantity: overrides.quantity ?? request.quantity,
    unit: overrides.unit ?? request.unit,
    estimatedWeightKg: overrides.estimatedWeightKg ?? request.estimatedWeightKg,
    pickupLocation: overrides.pickupLocation ?? request.pickupLocation,
    gpsCoordinates: overrides.gpsCoordinates ?? request.gpsCoordinates,
    status: overrides.status ?? 'Pending',
    scheduledDate: overrides.scheduledDate ?? null,
    scheduledTime: overrides.scheduledTime ?? null,
    driverName: overrides.driverName ?? null,
    driverPhone: overrides.driverPhone ?? null,
    vehiclePlateNumber: overrides.vehiclePlateNumber ?? null,
    vehicleType: overrides.vehicleType ?? null,
    routeNotes: overrides.routeNotes ?? null,
    collectedQuantity: overrides.collectedQuantity ?? null,
    collectedWeightKg: overrides.collectedWeightKg ?? null,
    collectionGpsCoordinates: overrides.collectionGpsCoordinates ?? null,
    collectionPhotos: overrides.collectionPhotos ?? [],
    collectionNotes: overrides.collectionNotes ?? null,
    collectedBy: overrides.collectedBy ?? null,
    collectedAt: overrides.collectedAt ?? null,
    completedBy: overrides.completedBy ?? null,
    completedAt: overrides.completedAt ?? null,
    cancelledBy: overrides.cancelledBy ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    cancellationReason: overrides.cancellationReason ?? null,
  })

  return { pickup, request, farmer, user }
}

/**
 * Creates an Inventory document directly (bypassing the auto-create event
 * listener), denormalizing from a linked Pickup + StorageRequest exactly
 * like the real listener does. Defaults to a fresh `Completed` pickup and
 * `Pending Placement` inventory status when no `pickupId` is given.
 */
export async function createInventoryRecord(
  overrides: Partial<IInventory> & { pickupId?: IInventory['pickupId'] } = {},
): Promise<{ inventory: IInventory; pickup: IPickup; request: IStorageRequest; farmer: IFarmer; user: IUser }> {
  let pickup: IPickup
  let request: IStorageRequest
  let farmer: IFarmer
  let user: IUser

  if (overrides.pickupId) {
    const existingPickup = await Pickup.findById(overrides.pickupId).exec()
    if (!existingPickup) throw new Error('createInventoryRecord: overrides.pickupId does not reference an existing pickup')
    pickup = existingPickup
    const existingRequest = await StorageRequest.findById(pickup.storageRequestId).exec()
    if (!existingRequest) throw new Error('createInventoryRecord: pickup.storageRequestId does not reference an existing storage request')
    request = existingRequest
    const existingFarmer = await Farmer.findById(pickup.farmerId).exec()
    if (!existingFarmer) throw new Error('createInventoryRecord: pickup.farmerId does not reference an existing farmer')
    farmer = existingFarmer
    const existingUser = await User.findById(farmer.userId).exec()
    if (!existingUser) throw new Error('createInventoryRecord: farmer.userId does not reference an existing user')
    user = existingUser
  } else {
    ;({ pickup, request, farmer, user } = await createPickupRecord({
      status: 'Completed',
      collectedQuantity: 480,
      collectedWeightKg: 480,
      collectedAt: new Date(),
    }))
  }

  const quantity = overrides.initialQuantity ?? pickup.collectedQuantity ?? pickup.quantity

  const inventory = await Inventory.create({
    inventoryCode: overrides.inventoryCode ?? unique('INV'),
    pickupId: pickup._id,
    storageRequestId: pickup.storageRequestId,
    requestNumber: overrides.requestNumber ?? pickup.requestNumber,
    farmerId: pickup.farmerId,
    farmerName: overrides.farmerName ?? pickup.farmerName,
    farmerNumber: overrides.farmerNumber ?? pickup.farmerNumber,
    produceType: overrides.produceType ?? pickup.produceType,
    unit: overrides.unit ?? pickup.unit,
    harvestDate: overrides.harvestDate ?? request.harvestDate,
    initialQuantity: quantity,
    currentQuantity: overrides.currentQuantity ?? quantity,
    reservedQuantity: overrides.reservedQuantity ?? 0,
    warehouseId: overrides.warehouseId ?? null,
    warehouseCode: overrides.warehouseCode ?? null,
    warehouseName: overrides.warehouseName ?? null,
    coldRoomId: overrides.coldRoomId ?? null,
    coldRoomCode: overrides.coldRoomCode ?? null,
    shelfLifeDays: overrides.shelfLifeDays ?? null,
    expiryDate: overrides.expiryDate ?? null,
    valuePerUnit: overrides.valuePerUnit ?? null,
    status: overrides.status ?? 'Pending Placement',
    receivedAt: overrides.receivedAt ?? null,
    receivedBy: overrides.receivedBy ?? null,
    disposedAt: overrides.disposedAt ?? null,
    disposedBy: overrides.disposedBy ?? null,
    disposalReason: overrides.disposalReason ?? null,
  })

  return { inventory, pickup, request, farmer, user }
}

/** Creates a QualityInspection document directly, denormalizing from a linked Inventory record (creating one if none is given). */
export async function createQualityInspectionRecord(
  overrides: Partial<IQualityInspection> & { inventoryId?: IQualityInspection['inventoryId'] } = {},
): Promise<{ inspection: IQualityInspection; inventory: IInventory }> {
  let inventory: IInventory

  if (overrides.inventoryId) {
    const existing = await Inventory.findById(overrides.inventoryId).exec()
    if (!existing) throw new Error('createQualityInspectionRecord: overrides.inventoryId does not reference an existing inventory record')
    inventory = existing
  } else {
    ;({ inventory } = await createInventoryRecord())
  }

  const inspection = await QualityInspection.create({
    inspectionCode: overrides.inspectionCode ?? unique('QI'),
    inventoryId: inventory._id,
    inventoryCode: overrides.inventoryCode ?? inventory.inventoryCode,
    produceType: overrides.produceType ?? inventory.produceType,
    warehouseId: overrides.warehouseId ?? inventory.warehouseId,
    warehouseCode: overrides.warehouseCode ?? inventory.warehouseCode,
    inspectorId: overrides.inspectorId ?? null,
    status: overrides.status ?? 'Pending',
    qualityGrade: overrides.qualityGrade ?? null,
    photos: overrides.photos ?? [],
    defects: overrides.defects ?? [],
    notes: overrides.notes ?? null,
    inspectedQuantity: overrides.inspectedQuantity ?? null,
    acceptedQuantity: overrides.acceptedQuantity ?? null,
    rejectedQuantity: overrides.rejectedQuantity ?? null,
    assignedAt: overrides.assignedAt ?? null,
    inspectedAt: overrides.inspectedAt ?? null,
  })

  return { inspection, inventory }
}

/** Creates a Customer document directly. */
export async function createCustomerRecord(overrides: Partial<ICustomer> = {}): Promise<ICustomer> {
  return Customer.create({
    customerCode: overrides.customerCode ?? unique('CUS'),
    name: overrides.name ?? 'Golden Spoon Restaurant',
    type: overrides.type ?? 'Restaurant',
    contactPerson: overrides.contactPerson ?? null,
    phone: overrides.phone ?? '+233 24 555 5555',
    email: overrides.email ?? null,
    address: overrides.address ?? '12 Liberation Road, Accra',
    status: overrides.status ?? 'Active',
    notes: overrides.notes ?? null,
  })
}

/**
 * Creates an Order document directly, with a single item sourced from a
 * fresh `In Stock`, valued Inventory record (creating one if none is
 * given). Defaults to `Draft` status.
 */
export async function createOrderRecord(
  overrides: Partial<IOrder> & { customerId?: IOrder['customerId']; inventoryId?: IInventory['_id'] } = {},
): Promise<{ order: IOrder; customer: ICustomer; inventory: IInventory }> {
  let customer: ICustomer
  if (overrides.customerId) {
    const existing = await Customer.findById(overrides.customerId).exec()
    if (!existing) throw new Error('createOrderRecord: overrides.customerId does not reference an existing customer')
    customer = existing
  } else {
    customer = await createCustomerRecord()
  }

  let inventory: IInventory
  if (overrides.inventoryId) {
    const existing = await Inventory.findById(overrides.inventoryId).exec()
    if (!existing) throw new Error('createOrderRecord: overrides.inventoryId does not reference an existing inventory record')
    inventory = existing
  } else {
    ;({ inventory } = await createInventoryRecord({ status: 'In Stock', currentQuantity: 500, valuePerUnit: 3 }))
  }

  const quantity = 100
  const unitPrice = 5.5
  const costPerUnit = inventory.valuePerUnit ?? 3
  const item = {
    inventoryId: inventory._id,
    produceType: inventory.produceType,
    quantity,
    unitPrice,
    subtotalAmount: quantity * unitPrice,
    farmerId: inventory.farmerId,
    costPerUnit,
  } as IOrderItem

  const subtotalAmount = item.subtotalAmount
  const farmerEarningsTotal = quantity * costPerUnit

  const order = await Order.create({
    orderNumber: overrides.orderNumber ?? unique('ORD'),
    invoiceNumber: overrides.invoiceNumber ?? null,
    customerId: customer._id,
    customerName: overrides.customerName ?? customer.name,
    items: overrides.items ?? [item],
    subtotalAmount: overrides.subtotalAmount ?? subtotalAmount,
    totalAmount: overrides.totalAmount ?? subtotalAmount,
    farmerEarningsTotal: overrides.farmerEarningsTotal ?? farmerEarningsTotal,
    profitAmount: overrides.profitAmount ?? subtotalAmount - farmerEarningsTotal,
    status: overrides.status ?? 'Draft',
    deliveryAddress: overrides.deliveryAddress ?? null,
    deliveryDate: overrides.deliveryDate ?? null,
    confirmedAt: overrides.confirmedAt ?? null,
    deliveredAt: overrides.deliveredAt ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    cancellationReason: overrides.cancellationReason ?? null,
    notes: overrides.notes ?? null,
  })

  return { order, customer, inventory }
}

/**
 * Creates a Payout document directly, sourced from a fresh `Confirmed`
 * Order's first line item (creating one if none is given).
 */
export async function createPayoutRecord(
  overrides: Partial<IPayout> & { orderId?: IPayout['orderId'] } = {},
): Promise<{ payout: IPayout; order: IOrder }> {
  let order: IOrder
  if (overrides.orderId) {
    const existing = await Order.findById(overrides.orderId).exec()
    if (!existing) throw new Error('createPayoutRecord: overrides.orderId does not reference an existing order')
    order = existing
  } else {
    ;({ order } = await createOrderRecord({ status: 'Confirmed' }))
  }

  const item = order.items[0]!
  const farmer = await Farmer.findById(item.farmerId).exec()
  if (!farmer) throw new Error('createPayoutRecord: order item farmerId does not reference an existing farmer')

  const payout = await Payout.create({
    payoutCode: overrides.payoutCode ?? unique('PO'),
    farmerId: item.farmerId,
    farmerName: overrides.farmerName ?? `${farmer.firstName} ${farmer.lastName}`,
    farmerNumber: overrides.farmerNumber ?? farmer.farmerNumber,
    orderId: order._id,
    orderNumber: overrides.orderNumber ?? order.orderNumber,
    amount: overrides.amount ?? order.farmerEarningsTotal,
    status: overrides.status ?? 'Pending',
    method: overrides.method ?? null,
    transactionId: overrides.transactionId ?? null,
    approvedBy: overrides.approvedBy ?? null,
    approvedAt: overrides.approvedAt ?? null,
    processedBy: overrides.processedBy ?? null,
    processedAt: overrides.processedAt ?? null,
    rejectedBy: overrides.rejectedBy ?? null,
    rejectedAt: overrides.rejectedAt ?? null,
    rejectionReason: overrides.rejectionReason ?? null,
    notes: overrides.notes ?? null,
  })

  return { payout, order }
}

/** Creates a Vehicle document directly. */
export async function createVehicleRecord(overrides: Partial<IVehicle> = {}): Promise<IVehicle> {
  return Vehicle.create({
    vehicleCode: overrides.vehicleCode ?? unique('VH'),
    plateNumber: overrides.plateNumber ?? unique('GT'),
    type: overrides.type ?? 'Refrigerated Truck',
    make: overrides.make ?? 'Toyota',
    vehicleModel: overrides.vehicleModel ?? 'Dyna',
    year: overrides.year ?? 2022,
    capacityKg: overrides.capacityKg ?? 5000,
    fuelType: overrides.fuelType ?? 'Diesel',
    currentMileageKm: overrides.currentMileageKm ?? 0,
    status: overrides.status ?? 'Available',
    assignedDriverId: overrides.assignedDriverId ?? null,
    notes: overrides.notes ?? null,
  })
}

/** Creates a Driver document directly. */
export async function createDriverRecord(overrides: Partial<IDriver> = {}): Promise<IDriver> {
  const inOneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  return Driver.create({
    driverCode: overrides.driverCode ?? unique('DR'),
    userId: overrides.userId ?? null,
    name: overrides.name ?? 'Kofi Mensah',
    phone: overrides.phone ?? '+233 24 222 2222',
    licenseNumber: overrides.licenseNumber ?? unique('GHA-DL'),
    licenseExpiryDate: overrides.licenseExpiryDate ?? inOneYear,
    status: overrides.status ?? 'Available',
    assignedVehicleId: overrides.assignedVehicleId ?? null,
    totalTripsCompleted: overrides.totalTripsCompleted ?? 0,
    performanceRating: overrides.performanceRating ?? null,
    notes: overrides.notes ?? null,
  })
}

/** Creates a Warehouse document directly. Defaults to no zones and zero occupancy. */
export async function createWarehouseRecord(overrides: Partial<IWarehouse> = {}): Promise<IWarehouse> {
  return Warehouse.create({
    warehouseCode: overrides.warehouseCode ?? unique('WH'),
    name: overrides.name ?? 'Nsawam Cold Store',
    location: overrides.location ?? 'Plot 12, Industrial Area',
    district: overrides.district ?? 'Nsawam-Adoagyiri',
    region: overrides.region ?? 'Eastern',
    gpsCoordinates: overrides.gpsCoordinates ?? null,
    totalCapacityKg: overrides.totalCapacityKg ?? 50000,
    currentOccupancyKg: overrides.currentOccupancyKg ?? 0,
    zones: overrides.zones ?? [],
    status: overrides.status ?? 'Active',
    notes: overrides.notes ?? null,
  })
}

/**
 * Creates a ColdRoom document directly, denormalizing from a linked
 * Warehouse (creating one if none is given) exactly like the real service.
 */
export async function createColdRoomRecord(
  overrides: Partial<IColdRoom> & { warehouseId?: IColdRoom['warehouseId'] } = {},
): Promise<{ coldRoom: IColdRoom; warehouse: IWarehouse }> {
  let warehouse: IWarehouse

  if (overrides.warehouseId) {
    const existing = await Warehouse.findById(overrides.warehouseId).exec()
    if (!existing) throw new Error('createColdRoomRecord: overrides.warehouseId does not reference an existing warehouse')
    warehouse = existing
  } else {
    warehouse = await createWarehouseRecord()
  }

  const coldRoom = await ColdRoom.create({
    coldRoomCode: overrides.coldRoomCode ?? unique('CR'),
    warehouseId: warehouse._id,
    warehouseCode: overrides.warehouseCode ?? warehouse.warehouseCode,
    warehouseName: overrides.warehouseName ?? warehouse.name,
    name: overrides.name ?? 'Cold Room 1',
    capacityKg: overrides.capacityKg ?? 8000,
    currentOccupancyKg: overrides.currentOccupancyKg ?? 0,
    targetTemperatureMinC: overrides.targetTemperatureMinC ?? 0,
    targetTemperatureMaxC: overrides.targetTemperatureMaxC ?? 4,
    currentTemperatureC: overrides.currentTemperatureC ?? null,
    targetHumidityMinPercent: overrides.targetHumidityMinPercent ?? 85,
    targetHumidityMaxPercent: overrides.targetHumidityMaxPercent ?? 95,
    currentHumidityPercent: overrides.currentHumidityPercent ?? null,
    lastReadingAt: overrides.lastReadingAt ?? null,
    status: overrides.status ?? 'Active',
    notes: overrides.notes ?? null,
  })

  return { coldRoom, warehouse }
}

/** Creates a Notification document directly, for a given (or freshly created) user. */
export async function createNotificationRecord(
  overrides: Partial<INotification> & { userId?: INotification['userId'] } = {},
): Promise<{ notification: INotification; user: IUser }> {
  let user: IUser
  if (overrides.userId) {
    const existing = await User.findById(overrides.userId).exec()
    if (!existing) throw new Error('createNotificationRecord: overrides.userId does not reference an existing user')
    user = existing
  } else {
    ;({ user } = await createActiveUser())
  }

  const notification = await Notification.create({
    userId: user._id,
    category: overrides.category ?? 'System',
    channel: overrides.channel ?? 'In-App',
    title: overrides.title ?? 'Test notification',
    message: overrides.message ?? 'This is a test notification.',
    isRead: overrides.isRead ?? false,
    readAt: overrides.readAt ?? null,
    relatedEntityType: overrides.relatedEntityType ?? null,
    relatedEntityId: overrides.relatedEntityId ?? null,
  })

  return { notification, user }
}

/** Creates a NotificationPreference document directly, for a given (or freshly created) user. */
export async function createNotificationPreferenceRecord(
  overrides: Partial<INotificationPreference> & { userId?: INotificationPreference['userId'] } = {},
): Promise<{ preference: INotificationPreference; user: IUser }> {
  let user: IUser
  if (overrides.userId) {
    const existing = await User.findById(overrides.userId).exec()
    if (!existing) throw new Error('createNotificationPreferenceRecord: overrides.userId does not reference an existing user')
    user = existing
  } else {
    ;({ user } = await createActiveUser())
  }

  const preference = await NotificationPreference.create({
    userId: user._id,
    inAppEnabled: overrides.inAppEnabled ?? true,
    emailEnabled: overrides.emailEnabled ?? true,
    smsEnabled: overrides.smsEnabled ?? false,
    whatsappEnabled: overrides.whatsappEnabled ?? false,
    pushEnabled: overrides.pushEnabled ?? false,
    mutedCategories: overrides.mutedCategories ?? [],
  })

  return { preference, user }
}
