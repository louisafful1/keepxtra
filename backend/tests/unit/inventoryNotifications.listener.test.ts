import { describe, expect, it, vi, afterEach } from 'vitest'
import { INVENTORY_EVENTS, inventoryEvents } from '../../src/events/inventory.events'
import { notificationLogger, registerInventoryNotificationListeners } from '../../src/events/listeners/inventoryNotifications.listener'

// `registerAllEventListeners()` (called once via `createApp()`) is
// idempotent, so calling this directly here is safe even though every
// integration test file that imports `testApp` also triggers it.
registerInventoryNotificationListeners()

afterEach(() => {
  vi.restoreAllMocks()
})

describe('registerInventoryNotificationListeners', () => {
  it('logs a "Produce Received Into Storage" notification event on Received', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    inventoryEvents.emit(INVENTORY_EVENTS.RECEIVED, {
      inventoryId: 'inv-1',
      inventoryCode: 'INV-00001',
      farmerId: 'farmer-1',
      farmerUserId: 'user-1',
      produceType: 'Tomatoes',
      warehouseId: 'wh-1',
      coldRoomId: null,
      receivedBy: 'ops-1',
      receivedAt: new Date(),
    })

    expect(spy).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ notification: 'Produce Received Into Storage', produceType: 'Tomatoes' }),
      'Notification event created',
    )
  })
})
