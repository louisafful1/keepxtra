import type { PermissionKey } from './permissions'

export type RoleScope = 'farmer' | 'operations'

export interface RoleDefinition {
  name: string
  scope: RoleScope
  description: string
  /** `'*'` grants every permission in the catalogue (Super Admin). */
  permissions: PermissionKey[] | '*'
}

/**
 * The default role set, mirroring the frontend's `ROLE_PERMISSIONS` matrix
 * (`src/types/permissions.ts`) plus a `Farmer` role for the farmer-facing
 * side of the app. Data only. The `Farmer` role, in particular, is
 * lazily created by `FarmerService` the first time a farmer is registered
 * (see `farmer.repository.ts`'s `ensureFarmerRole`) rather than by a
 * separate seed step — there's no seed script yet.
 */
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  { name: 'Farmer', scope: 'farmer', description: 'Farmer portal access — scoped to their own data.', permissions: [] },
  { name: 'Super Admin', scope: 'operations', description: 'Full access to every module.', permissions: '*' },
  {
    name: 'Manager',
    scope: 'operations',
    description: 'Oversees day-to-day operations across every module except payment configuration and role management.',
    permissions: [
      'farmers.create',
      'farmers.read',
      'farmers.update',
      'farmers.delete',
      'storage-requests.read',
      'storage-requests.review',
      'storage-requests.update',
      'pickups.manage',
      'warehouses.manage',
      'inventory.view',
      'inventory.manage',
      'inspections.manage',
      'sales.create',
      'payments.approve',
      'fleet.manage',
      'drivers.manage',
      'notifications.send',
      'reports.view',
      'analytics.view',
      'audit-log.view',
      'settings.company',
    ],
  },
  {
    name: 'Operations',
    scope: 'operations',
    description: 'Runs storage requests, pickups, inventory, and sales.',
    permissions: [
      'farmers.create',
      'farmers.read',
      'farmers.update',
      'storage-requests.read',
      'storage-requests.review',
      'storage-requests.update',
      'pickups.manage',
      'inventory.view',
      'inspections.manage',
      'sales.create',
      'fleet.manage',
      'drivers.manage',
      'reports.view',
    ],
  },
  {
    name: 'Warehouse Staff',
    scope: 'operations',
    description: 'Manages inventory, inspections, and warehouse operations.',
    permissions: ['inventory.view', 'inventory.manage', 'inspections.manage', 'warehouses.manage'],
  },
  {
    name: 'Driver',
    scope: 'operations',
    description: 'Handles pickup collection duties.',
    permissions: ['pickups.manage'],
  },
  {
    name: 'Finance',
    scope: 'operations',
    description: 'Approves and processes farmer payouts.',
    permissions: ['payments.approve', 'payments.process', 'reports.view', 'analytics.view', 'settings.payment-config'],
  },
]
