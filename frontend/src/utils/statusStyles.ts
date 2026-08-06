export type StatusTone = 'green' | 'amber' | 'blue' | 'red' | 'gray'

const toneClasses: Record<StatusTone, { bg: string; text: string; dot: string }> = {
  green: { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  red: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  gray: { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
}

/** Central status → tone map. Add new statuses here as the mock domain grows. */
const statusToneMap: Record<string, StatusTone> = {
  // Produce
  'Pending Inspection': 'amber',
  'In Storage': 'green',
  Reserved: 'blue',
  Sold: 'gray',
  Disposed: 'red',
  // Storage requests / pickups
  Pending: 'amber',
  Approved: 'blue',
  Rejected: 'red',
  'Info Requested': 'amber',
  'Vehicle Assigned': 'blue',
  'Driver Assigned': 'blue',
  'Driver En Route': 'blue',
  Collected: 'green',
  'Delivered to Warehouse': 'green',
  Completed: 'green',
  // Payments / payouts
  Paid: 'green',
  Processing: 'amber',
  // Farmer accounts
  Active: 'green',
  Suspended: 'red',
  'Pending Review': 'amber',
  // Fleet
  Available: 'green',
  'On Route': 'blue',
  Maintenance: 'red',
  'Up to Date': 'green',
  'Due Soon': 'amber',
  Overdue: 'red',
  // Drivers
  'On Delivery': 'blue',
  'Off Duty': 'gray',
  // Cold rooms
  Operational: 'green',
  'Under Maintenance': 'amber',
  Offline: 'red',
  // Inspection outcomes
  'Partial Acceptance': 'amber',
  // Orders
  Confirmed: 'blue',
  'Out for Delivery': 'blue',
  Delivered: 'green',
  Cancelled: 'red',
}

export function getStatusTone(status: string): StatusTone {
  return statusToneMap[status] ?? 'gray'
}

export function getStatusClasses(status: string) {
  return toneClasses[getStatusTone(status)]
}
