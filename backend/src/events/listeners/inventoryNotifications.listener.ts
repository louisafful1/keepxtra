import { logger } from '../../config/logger'
import { INVENTORY_EVENTS, inventoryEvents } from '../inventory.events'

export const notificationLogger = logger.child({ module: 'notifications' })

/** Stand-in for the future NotificationService — same "log what would have been sent" pattern used throughout. */
export function registerInventoryNotificationListeners(): void {
  inventoryEvents.on(INVENTORY_EVENTS.RECEIVED, (event) => {
    notificationLogger.info({ notification: 'Produce Received Into Storage', ...event }, 'Notification event created')
  })
}
