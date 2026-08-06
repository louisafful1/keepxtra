import { logger } from '../../config/logger'
import { PICKUP_EVENTS, pickupEvents } from '../pickup.events'

// Exported so tests can spy on the exact instance this listener writes
// through — see storageRequestNotifications.listener.ts for why a fresh
// `logger.child(...)` call in a test would miss every call.
export const notificationLogger = logger.child({ module: 'notifications' })

/**
 * Stand-in for the future NotificationService — same "log what would have
 * been sent" pattern as `storageRequestNotifications.listener.ts`.
 */
export function registerPickupNotificationListeners(): void {
  pickupEvents.on(PICKUP_EVENTS.SCHEDULED, (event) => {
    notificationLogger.info({ notification: 'Pickup Scheduled', ...event }, 'Notification event created')
  })

  pickupEvents.on(PICKUP_EVENTS.COMPLETED, (event) => {
    notificationLogger.info({ notification: 'Pickup Completed', ...event }, 'Notification event created')
  })

  pickupEvents.on(PICKUP_EVENTS.CANCELLED, (event) => {
    notificationLogger.info({ notification: 'Pickup Cancelled', ...event }, 'Notification event created')
  })
}
