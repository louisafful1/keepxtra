import { logger } from '../../config/logger'
import { ORDER_EVENTS, orderEvents } from '../order.events'

export const notificationLogger = logger.child({ module: 'notifications' })

/** Stand-in for the future NotificationService — same "log what would have been sent" pattern used throughout. */
export function registerOrderNotificationListeners(): void {
  orderEvents.on(ORDER_EVENTS.CONFIRMED, (event) => {
    notificationLogger.info({ notification: 'Order Confirmed — Farmer Earnings Payable', ...event }, 'Notification event created')
  })

  orderEvents.on(ORDER_EVENTS.CANCELLED, (event) => {
    notificationLogger.info({ notification: 'Order Cancelled', ...event }, 'Notification event created')
  })
}
