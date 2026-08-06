import { describe, expect, it, vi, afterEach } from 'vitest'
import { registerAllEventListeners } from '../../src/events/registerListeners'
import { notificationLogger } from '../../src/events/listeners/storageRequestNotifications.listener'
import { STORAGE_REQUEST_EVENTS, storageRequestEvents } from '../../src/events/storageRequest.events'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('registerAllEventListeners', () => {
  it('is idempotent — calling it again does not double-register listeners', () => {
    registerAllEventListeners()
    registerAllEventListeners()

    const spy = vi.spyOn(notificationLogger, 'info')

    storageRequestEvents.emit(STORAGE_REQUEST_EVENTS.APPROVED, {
      storageRequestId: 'sr-1',
      requestNumber: 'SR-00001',
      farmerId: 'farmer-1',
      farmerUserId: 'user-1',
      approvedBy: 'ops-1',
      approvedAt: new Date(),
    })

    // A duplicate registration would have logged twice.
    expect(spy).toHaveBeenCalledOnce()
  })
})
