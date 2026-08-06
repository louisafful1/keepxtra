import { logger } from '../../config/logger'
import { PICKUP_EVENTS, pickupEvents } from '../pickup.events'
import { inventoryService } from '../../services/inventory.service'

const inventoryLogger = logger.child({ module: 'inventory' })

/**
 * The Inventory-side half of the same automation pattern Pickup itself
 * fulfilled for Storage Request: the moment a pickup is completed, an
 * Inventory record is born (in `Pending Placement`, awaiting a
 * warehouse/cold-room assignment via `receive`).
 *
 * Fire-and-forget, same reasoning as `pickupAutoCreate.listener.ts` — the
 * `complete` HTTP response is not held up by inventory creation, and a
 * failure here is logged rather than thrown.
 */
export function registerInventoryAutoCreateListener(): void {
  pickupEvents.on(PICKUP_EVENTS.COMPLETED, (event) => {
    inventoryService.createFromCompletedPickup(event).catch((err: unknown) => {
      inventoryLogger.error({ err, pickupId: event.pickupId }, 'Failed to auto-create inventory from completed pickup')
    })
  })
}
