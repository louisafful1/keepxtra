import { createEventBus } from './eventBus'

/**
 * The extension point a future Payments module (a later phase) will
 * consume: the moment an order is confirmed, farmer earnings become
 * payable. `farmerEarnings` is aggregated per unique farmer (an order can
 * carry items sourced from several farmers) so the future listener can
 * create one payout per farmer without recomputing anything.
 */
export const ORDER_EVENTS = {
  CONFIRMED: 'order.confirmed',
  CANCELLED: 'order.cancelled',
} as const

export interface OrderFarmerEarning {
  farmerId: string
  amount: number
}

export interface OrderConfirmedEvent {
  orderId: string
  orderNumber: string
  invoiceNumber: string
  customerId: string
  totalAmount: number
  farmerEarnings: OrderFarmerEarning[]
  confirmedBy: string
  confirmedAt: Date
}

export interface OrderCancelledEvent {
  orderId: string
  orderNumber: string
  wasConfirmed: boolean
  cancelledBy: string
  cancelledAt: Date
  reason: string
}

export interface OrderEventMap {
  [ORDER_EVENTS.CONFIRMED]: OrderConfirmedEvent
  [ORDER_EVENTS.CANCELLED]: OrderCancelledEvent
}

export const orderEvents = createEventBus<OrderEventMap>()
