export type DriverAvailability = 'Available' | 'On Delivery' | 'Off Duty'

export interface Driver {
  id: string
  name: string
  avatarInitials: string
  licenseNumber: string
  phone: string
  assignedVehiclePlate?: string
  todaysDeliveries: number
  completedDeliveries: number
  performanceRating: number
  availability: DriverAvailability
}
