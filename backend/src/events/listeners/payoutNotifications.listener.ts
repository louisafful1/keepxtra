import { logger } from '../../config/logger'
import { PAYOUT_EVENTS, payoutEvents } from '../payout.events'

export const notificationLogger = logger.child({ module: 'notifications' })

/** Stand-in for the future NotificationService — same "log what would have been sent" pattern used throughout. */
export function registerPayoutNotificationListeners(): void {
  payoutEvents.on(PAYOUT_EVENTS.PAID, (event) => {
    notificationLogger.info({ notification: 'Payout Paid', ...event }, 'Notification event created')
  })
}
