import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'

export type PayoutStatus = 'Pending' | 'Approved' | 'Paid' | 'Rejected'
export type PayoutMethod = 'Bank Transfer' | 'Mobile Money'

/**
 * A Payout is always born from a confirmed Order — subscribed by
 * `payoutAutoCreate.listener.ts` to `ORDER_EVENTS.CONFIRMED`, exactly the
 * extension point Module 7's doc comment promised. One Payout per
 * (order, farmer) pair — an order can carry items from several farmers,
 * each of whom is owed separately. `Pending` is the birth state;
 * `approve`/`reject` decide whether it proceeds, and `process` is where
 * ops records the external transfer they actually performed (KeepXtra
 * does not integrate with a real payment gateway — this is record-keeping
 * of a transfer done via bank/MoMo outside the system).
 */
export interface IPayout extends Document {
  payoutCode: string
  farmerId: Types.ObjectId
  farmerName: string
  farmerNumber: string
  orderId: Types.ObjectId
  orderNumber: string
  amount: number

  status: PayoutStatus
  method: PayoutMethod | null
  transactionId: string | null

  approvedBy: Types.ObjectId | null
  approvedAt: Date | null
  processedBy: Types.ObjectId | null
  processedAt: Date | null
  rejectedBy: Types.ObjectId | null
  rejectedAt: Date | null
  rejectionReason: string | null
  notes: string | null

  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const payoutSchema = new Schema<IPayout>(
  {
    payoutCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true },
    farmerName: { type: String, required: true, trim: true },
    farmerNumber: { type: String, required: true, trim: true, uppercase: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    orderNumber: { type: String, required: true, trim: true, uppercase: true },
    amount: { type: Number, required: true, min: 0.01 },

    status: { type: String, enum: ['Pending', 'Approved', 'Paid', 'Rejected'], default: 'Pending' },
    method: { type: String, enum: ['Bank Transfer', 'Mobile Money'], default: null },
    transactionId: { type: String, default: null, trim: true },

    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true },
)

payoutSchema.plugin(auditablePlugin)

payoutSchema.index({ orderId: 1, farmerId: 1 }, { unique: true })
payoutSchema.index({ status: 1 })
payoutSchema.index({ farmerId: 1, status: 1 })

export const Payout = model<IPayout>('Payout', payoutSchema)
