import { createEventBus } from './eventBus'

export const PAYOUT_EVENTS = {
  PAID: 'payout.paid',
} as const

export interface PayoutPaidEvent {
  payoutId: string
  payoutCode: string
  farmerId: string
  farmerUserId: string
  amount: number
  method: string
  transactionId: string
  paidAt: Date
}

export interface PayoutEventMap {
  [PAYOUT_EVENTS.PAID]: PayoutPaidEvent
}

export const payoutEvents = createEventBus<PayoutEventMap>()
