import { logger } from '../../config/logger'
import { STORAGE_REQUEST_EVENTS, storageRequestEvents } from '../storageRequest.events'
import { pickupService } from '../../services/pickup.service'

const pickupLogger = logger.child({ module: 'pickups' })

/**
 * The concrete realization of the automation promised in the Storage
 * Request phase: the moment a request is approved, a Pickup record is
 * born (in `Pending` status, awaiting driver/vehicle assignment).
 *
 * Runs fire-and-forget relative to the approval HTTP request — the
 * `EventEmitter` invokes this listener synchronously but does not await an
 * async handler, so the approval response is not held up by pickup
 * creation. A failure here is logged rather than thrown; it must never
 * take down the process or roll back the approval that already succeeded.
 */
export function registerPickupAutoCreateListener(): void {
  storageRequestEvents.on(STORAGE_REQUEST_EVENTS.APPROVED, (event) => {
    pickupService.createFromApprovedStorageRequest(event).catch((err: unknown) => {
      pickupLogger.error({ err, storageRequestId: event.storageRequestId }, 'Failed to auto-create pickup from approved storage request')
    })
  })
}
