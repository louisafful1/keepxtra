import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'

export type CustomerType = 'Restaurant' | 'Hotel' | 'Retailer' | 'Wholesaler' | 'Other'
export type CustomerStatus = 'Active' | 'Inactive'

export interface ICustomer extends Document {
  customerCode: string
  name: string
  type: CustomerType
  contactPerson: string | null
  phone: string
  email: string | null
  address: string
  status: CustomerStatus
  notes: string | null

  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const customerSchema = new Schema<ICustomer>(
  {
    customerCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Restaurant', 'Hotel', 'Retailer', 'Wholesaler', 'Other'], required: true },
    contactPerson: { type: String, default: null, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    notes: { type: String, default: null },
  },
  { timestamps: true },
)

customerSchema.plugin(auditablePlugin)

customerSchema.index({ status: 1 })
customerSchema.index({ type: 1 })

export const Customer = model<ICustomer>('Customer', customerSchema)
