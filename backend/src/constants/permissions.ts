/**
 * The canonical permission catalogue. `PermissionKey` is what
 * `requirePermission(...)` accepts, so this file grows one entry at a time
 * as each business module ships — the Farmers module is the first to
 * actually enforce its keys (`farmers.create/read/update/delete`) end to
 * end; earlier entries are reserved for modules still to come.
 */
export interface PermissionDefinition {
  key: string
  module: string
  description: string
}

export const PERMISSIONS = [
  { key: 'farmers.create', module: 'Farmers', description: 'Register new farmers' },
  { key: 'farmers.read', module: 'Farmers', description: 'View the farmer directory and individual profiles' },
  { key: 'farmers.update', module: 'Farmers', description: 'Edit farmer profiles and toggle active/inactive status' },
  { key: 'farmers.delete', module: 'Farmers', description: 'Soft-delete and restore farmer records' },
  { key: 'storage-requests.review', module: 'Storage', description: 'Approve, reject, or request info on storage requests' },
  { key: 'pickups.manage', module: 'Pickups', description: 'Approve pickups and assign drivers/vehicles' },
  { key: 'warehouses.manage', module: 'Warehouses', description: 'Manage warehouses and cold rooms' },
  { key: 'inventory.view', module: 'Inventory', description: 'View cold-storage inventory' },
  { key: 'inventory.manage', module: 'Inventory', description: 'Receive produce and adjust inventory' },
  { key: 'inspections.manage', module: 'Inspections', description: 'Record quality inspections' },
  { key: 'sales.create', module: 'Sales', description: 'Record sales and manage orders' },
  { key: 'payments.approve', module: 'Payments', description: 'Approve or reject farmer payouts' },
  { key: 'payments.process', module: 'Payments', description: 'Mark payouts as paid/disbursed' },
  { key: 'reports.view', module: 'Reports', description: 'View operational reports' },
  { key: 'analytics.view', module: 'Analytics', description: 'View analytics dashboards' },
  { key: 'audit-log.view', module: 'Audit', description: 'View the platform audit trail' },
  { key: 'settings.company', module: 'Settings', description: 'Manage company profile and general settings' },
  { key: 'settings.roles', module: 'Settings', description: 'Manage operations roles and permissions' },
  { key: 'settings.payment-config', module: 'Settings', description: 'Manage commission and payout configuration' },
  { key: 'fleet.manage', module: 'Fleet', description: 'Manage fleet vehicles' },
  { key: 'drivers.manage', module: 'Fleet', description: 'Manage drivers' },
] as const satisfies readonly PermissionDefinition[]

export type PermissionKey = (typeof PERMISSIONS)[number]['key']
