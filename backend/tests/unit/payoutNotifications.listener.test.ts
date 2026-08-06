import { describe, expect, it, vi, afterEach } from 'vitest'
import { PAYOUT_EVENTS, payoutEvents } from '../../src/events/payout.events'
import { notificationLogger, registerPayoutNotificationListeners } from '../../src/events/listeners/payoutNotifications.listener'

// `registerAllEventListeners()` (called once via `createApp()`) is
// idempotent, so calling this directly here is safe even though every
// integration test file that imports `testApp` also triggers it.
registerPayoutNotificationListeners()

afterEach(() => {
  vi.restoreAllMocks()
})

describe('registerPayoutNotificationListeners', () => {
  it('logs a "Payout Paid" notification event on Paid', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    payoutEvents.emit(PAYOUT_EVENTS.PAID, {
      payoutId: 'po-1',
      payoutCode: 'PO-00001',
      farmerId: 'farmer-1',
      farmerUserId: 'user-1',
      amount: 350,
      method: 'Mobile Money',
      transactionId: 'TXN-001',
      paidAt: new Date(),
    })

    expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ notification: 'Payout Paid', amount: 350 }), 'Notification event created')
  })
})
