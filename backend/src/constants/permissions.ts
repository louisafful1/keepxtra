/**
 * The canonical permission catalogue, mirroring the frontend's
 * `src/types/permissions.ts` plus the `fleet.manage` / `drivers.manage`
 * additions flagged in the SAD (§6.9). This is data, not logic — the
 * `permissions` collection is seeded from this list by a future seed
 * script; no business/auth module reads this file directly yet.
 */
export interface PermissionDefinition {
  key: string
  module: string
  description: string
}

export const PERMISSIONS = [
  { key: 'farmers.view', module: 'Farmers', description: 'View the farmer directory' },
  { key: 'farmers.manage', module: 'Farmers', description: 'Register, suspend, and reactivate farmers' },
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
