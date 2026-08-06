import { describe, expect, it, vi, afterEach } from 'vitest'
import { PICKUP_EVENTS, pickupEvents } from '../../src/events/pickup.events'
import { notificationLogger, registerPickupNotificationListeners } from '../../src/events/listeners/pickupNotifications.listener'

// `registerAllEventListeners()` (called once via `createApp()`) is
// idempotent, so calling this directly here is safe even though every
// integration test file that imports `testApp` also triggers it.
registerPickupNotificationListeners()

afterEach(() => {
  vi.restoreAllMocks()
})

const baseEvent = {
  pickupId: 'pickup-1',
  pickupNumber: 'PU-00001',
  storageRequestId: 'sr-1',
  farmerId: 'farmer-1',
  farmerUserId: 'user-1',
}

describe('registerPickupNotificationListeners', () => {
  it('logs a "Pickup Scheduled" notification event on Scheduled', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    pickupEvents.emit(PICKUP_EVENTS.SCHEDULED, { ...baseEvent, scheduledDate: new Date(), scheduledBy: 'ops-1' })

    expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ notification: 'Pickup Scheduled' }), 'Notification event created')
  })

  it('logs a "Pickup Completed" notification event on Completed', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    pickupEvents.emit(PICKUP_EVENTS.COMPLETED, { ...baseEvent, completedBy: 'ops-1', completedAt: new Date() })

    expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ notification: 'Pickup Completed' }), 'Notification event created')
  })

  it('logs a "Pickup Cancelled" notification event on Cancelled', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    pickupEvents.emit(PICKUP_EVENTS.CANCELLED, { ...baseEvent, cancelledBy: 'ops-1', cancelledAt: new Date(), reason: 'x' })

    expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ notification: 'Pickup Cancelled' }), 'Notification event created')
  })

  it('does not log anything for Collected (no notification defined for this transition)', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    pickupEvents.emit(PICKUP_EVENTS.COLLECTED, {
      ...baseEvent,
      collectedQuantity: 1,
      collectedWeightKg: 1,
      collectedBy: 'ops-1',
      collectedAt: new Date(),
    })

    expect(spy).not.toHaveBeenCalled()
  })
})
