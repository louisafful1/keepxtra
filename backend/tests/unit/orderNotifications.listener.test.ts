import { describe, expect, it, vi, afterEach } from 'vitest'
import { ORDER_EVENTS, orderEvents } from '../../src/events/order.events'
import { notificationLogger, registerOrderNotificationListeners } from '../../src/events/listeners/orderNotifications.listener'

// `registerAllEventListeners()` (called once via `createApp()`) is
// idempotent, so calling this directly here is safe even though every
// integration test file that imports `testApp` also triggers it.
registerOrderNotificationListeners()

afterEach(() => {
  vi.restoreAllMocks()
})

describe('registerOrderNotificationListeners', () => {
  it('logs a notification event on Confirmed', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    orderEvents.emit(ORDER_EVENTS.CONFIRMED, {
      orderId: 'ord-1',
      orderNumber: 'ORD-00001',
      invoiceNumber: 'INV-00001',
      customerId: 'cus-1',
      totalAmount: 550,
      farmerEarnings: [{ farmerId: 'farmer-1', amount: 300 }],
      confirmedBy: 'ops-1',
      confirmedAt: new Date(),
    })

    expect(spy).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ notification: 'Order Confirmed — Farmer Earnings Payable', orderNumber: 'ORD-00001' }),
      'Notification event created',
    )
  })

  it('logs a notification event on Cancelled', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    orderEvents.emit(ORDER_EVENTS.CANCELLED, {
      orderId: 'ord-2',
      orderNumber: 'ORD-00002',
      wasConfirmed: true,
      cancelledBy: 'ops-1',
      cancelledAt: new Date(),
      reason: 'Customer changed mind',
    })

    expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ notification: 'Order Cancelled' }), 'Notification event created')
  })
})
