import { logger } from '../../config/logger'
import { QUALITY_INSPECTION_EVENTS, qualityInspectionEvents } from '../qualityInspection.events'

export const notificationLogger = logger.child({ module: 'notifications' })

/** Stand-in for the future NotificationService — same "log what would have been sent" pattern used throughout. */
export function registerQualityInspectionNotificationListeners(): void {
  qualityInspectionEvents.on(QUALITY_INSPECTION_EVENTS.COMPLETED, (event) => {
    notificationLogger.info({ notification: `Quality Inspection ${event.status}`, ...event }, 'Notification event created')
  })
}
