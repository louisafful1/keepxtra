import { Schema, model, type Document, type Types } from 'mongoose'
import { auditablePlugin } from './plugins/auditable.plugin'

export type OrderStatus = 'Draft' | 'Confirmed' | 'Delivered' | 'Cancelled'

export interface IOrderItem {
  _id: Types.ObjectId
  inventoryId: Types.ObjectId
  produceType: string
  quantity: number
  unitPrice: number
  subtotalAmount: number
  farmerId: Types.ObjectId
  /** The farmer payout rate — a snapshot of `Inventory.valuePerUnit` at order-creation time. */
  costPerUnit: number
}

/**
 * An Order carries its own financial snapshot (subtotal/total/farmer
 * earnings/profit) computed once at creation and re-validated at
 * `confirm` — never recomputed later, so historical orders stay accurate
 * even if an underlying Inventory record's value changes afterward.
 * `confirm` is the point stock actually leaves Inventory (see
 * order.service.ts); a `Draft` order reserves nothing.
 */
export interface IOrder extends Document {
  orderNumber: string
  invoiceNumber: string | null
  customerId: Types.ObjectId
  customerName: string
  items: IOrderItem[]

  subtotalAmount: number
  totalAmount: number
  farmerEarningsTotal: number
  profitAmount: number

  status: OrderStatus
  deliveryAddress: string | null
  deliveryDate: Date | null

  confirmedAt: Date | null
  deliveredAt: Date | null
  cancelledAt: Date | null
  cancellationReason: string | null
  notes: string | null

  isDeleted: boolean
  deletedAt: Date | null
  createdBy: Types.ObjectId | null
  updatedBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const orderItemSchema = new Schema<IOrderItem>({
  inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
  produceType: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotalAmount: { type: Number, required: true, min: 0 },
  farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true },
  costPerUnit: { type: Number, required: true, min: 0 },
})

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    invoiceNumber: { type: String, default: null, trim: true, uppercase: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true, trim: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (value: IOrderItem[]) => value.length > 0, message: 'An order must have at least one item' },
    },

    subtotalAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    farmerEarningsTotal: { type: Number, required: true, min: 0 },
    profitAmount: { type: Number, required: true },

    status: { type: String, enum: ['Draft', 'Confirmed', 'Delivered', 'Cancelled'], default: 'Draft' },
    deliveryAddress: { type: String, default: null, trim: true },
    deliveryDate: { type: Date, default: null },

    confirmedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true },
)

orderSchema.plugin(auditablePlugin)

orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ customerId: 1 })
orderSchema.index({ 'items.farmerId': 1 })

export const Order = model<IOrder>('Order', orderSchema)
