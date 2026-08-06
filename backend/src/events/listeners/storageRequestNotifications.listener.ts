import { logger } from '../../config/logger'
import { STORAGE_REQUEST_EVENTS, storageRequestEvents } from '../storageRequest.events'

// Exported so tests can spy on the exact instance this listener writes
// through — a fresh `logger.child(...)` call in a test would return a
// different object and silently miss every call.
export const notificationLogger = logger.child({ module: 'notifications' })

/**
 * Stand-in for the future NotificationService (the SAD's `notifications`
 * collection / NotificationService — not built yet). Subscribes to the
 * same event bus a future Pickup module will also listen to, and for now
 * just logs what *would* become a persisted, pushed notification —
 * mirroring Phase 2's mock `mailService` pattern of "log what would have
 * been sent" rather than building a queue this phase.
 *
 * Only Approved/Rejected notify the farmer — Cancelled is the farmer's own
 * action, so there's no one else to tell.
 */
export function registerStorageRequestNotificationListeners(): void {
  storageRequestEvents.on(STORAGE_REQUEST_EVENTS.APPROVED, (event) => {
    notificationLogger.info({ notification: 'Storage Request Approved', ...event }, 'Notification event created')
  })

  storageRequestEvents.on(STORAGE_REQUEST_EVENTS.REJECTED, (event) => {
    notificationLogger.info({ notification: 'Storage Request Rejected', ...event }, 'Notification event created')
  })
}
