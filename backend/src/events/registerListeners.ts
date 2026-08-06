import { registerStorageRequestNotificationListeners } from './listeners/storageRequestNotifications.listener'
import { registerPickupAutoCreateListener } from './listeners/pickupAutoCreate.listener'
import { registerPickupNotificationListeners } from './listeners/pickupNotifications.listener'
import { registerInventoryAutoCreateListener } from './listeners/inventoryAutoCreate.listener'
import { registerInventoryNotificationListeners } from './listeners/inventoryNotifications.listener'
import { registerQualityInspectionAutoCreateListener } from './listeners/qualityInspectionAutoCreate.listener'
import { registerQualityInspectionNotificationListeners } from './listeners/qualityInspectionNotifications.listener'
import { registerOrderNotificationListeners } from './listeners/orderNotifications.listener'
import { registerPayoutAutoCreateListener } from './listeners/payoutAutoCreate.listener'
import { registerPayoutNotificationListeners } from './listeners/payoutNotifications.listener'

let registered = false

/**
 * Wires up every module's event listeners. Called once from `app.ts` — the
 * idempotency guard makes it safe even if `createApp()` ever runs more
 * than once in the same process (e.g. a test file building extra app
 * instances), since Node's `EventEmitter` would otherwise accumulate a
 * duplicate listener per call.
 */
export function registerAllEventListeners(): void {
  if (registered) return
  registered = true

  registerStorageRequestNotificationListeners()
  registerPickupAutoCreateListener()
  registerPickupNotificationListeners()
  registerInventoryAutoCreateListener()
  registerInventoryNotificationListeners()
  registerQualityInspectionAutoCreateListener()
  registerQualityInspectionNotificationListeners()
  registerOrderNotificationListeners()
  registerPayoutAutoCreateListener()
  registerPayoutNotificationListeners()
}
