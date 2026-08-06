import type { CustomerStatus, CustomerType } from '../models/customer.model'

export interface CustomerDto {
  id: string
  customerCode: string
  name: string
  type: CustomerType
  contactPerson: string | null
  phone: string
  email: string | null
  address: string
  status: CustomerStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
}
