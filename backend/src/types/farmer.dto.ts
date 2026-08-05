import type { BankDetails, FarmerStatus, GpsCoordinates, MobileMoneyDetails, PaymentMethod, PickupDay } from '../models/farmer.model'

export interface FarmerDto {
  id: string
  userId: string
  farmerNumber: string
  firstName: string
  lastName: string
  fullName: string
  phone: string
  alternativePhone: string | null
  email: string
  nationalId: string | null
  farmName: string
  farmLocation: string
  district: string
  region: string
  gpsCoordinates: GpsCoordinates | null
  primaryCrops: string[]
  preferredPickupDays: PickupDay[]
  preferredPaymentMethod: PaymentMethod
  bankDetails: BankDetails | null
  mobileMoneyDetails: MobileMoneyDetails | null
  status: FarmerStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
}
