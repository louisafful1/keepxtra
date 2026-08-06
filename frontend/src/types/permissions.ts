/**
 * Fine-grained operational roles, distinct from the top-level auth
 * `UserRole` ('farmer' | 'admin') that drives login/routing. Today every
 * admin demo account is treated as 'Super Admin' (see usePermissions), but
 * the permission map below is what the UI actually gates against — so
 * wiring up real per-employee roles later is a data change, not a UI one.
 */
export type OperationsRole =
  | 'Operations'
  | 'Warehouse Staff'
  | 'Driver'
  | 'Finance'
  | 'Manager'
  | 'Super Admin'

export type Permission =
  | 'farmers.view'
  | 'farmers.manage'
  | 'storage-requests.review'
  | 'pickups.manage'
  | 'warehouses.manage'
  | 'inventory.view'
  | 'inventory.manage'
  | 'inspections.manage'
  | 'sales.create'
  | 'payments.approve'
  | 'payments.process'
  | 'reports.view'
  | 'analytics.view'
  | 'audit-log.view'
  | 'settings.company'
  | 'settings.roles'
  | 'settings.payment-config'

const ALL_PERMISSIONS: Permission[] = [
  'farmers.view',
  'farmers.manage',
  'storage-requests.review',
  'pickups.manage',
  'warehouses.manage',
  'inventory.view',
  'inventory.manage',
  'inspections.manage',
  'sales.create',
  'payments.approve',
  'payments.process',
  'reports.view',
  'analytics.view',
  'audit-log.view',
  'settings.company',
  'settings.roles',
  'settings.payment-config',
]

export const ROLE_PERMISSIONS: Record<OperationsRole, Permission[]> = {
  'Super Admin': ALL_PERMISSIONS,
  Manager: [
    'farmers.view',
    'farmers.manage',
    'storage-requests.review',
    'pickups.manage',
    'warehouses.manage',
    'inventory.view',
    'inventory.manage',
    'inspections.manage',
    'sales.create',
    'payments.approve',
    'reports.view',
    'analytics.view',
    'audit-log.view',
    'settings.company',
  ],
  Operations: [
    'farmers.view',
    'storage-requests.review',
    'pickups.manage',
    'inventory.view',
    'inspections.manage',
    'sales.create',
    'reports.view',
  ],
  'Warehouse Staff': ['inventory.view', 'inventory.manage', 'inspections.manage', 'warehouses.manage'],
  Driver: ['pickups.manage'],
  Finance: ['payments.approve', 'payments.process', 'reports.view', 'analytics.view', 'settings.payment-config'],
}

export const operationsRoles: OperationsRole[] = [
  'Super Admin',
  'Manager',
  'Operations',
  'Warehouse Staff',
  'Driver',
  'Finance',
]
