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
  'In Storage': 'green',
  Reserved: 'blue',
  Sold: 'gray',
  Disposed: 'red',
  // Pickup
  Pending: 'amber',
  Approved: 'blue',
  'Vehicle Assigned': 'blue',
  'Driver En Route': 'blue',
  Collected: 'green',
  'Delivered to Warehouse': 'green',
  // Payments
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
