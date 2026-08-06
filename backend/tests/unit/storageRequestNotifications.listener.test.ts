import { describe, expect, it, vi, afterEach } from 'vitest'
import { STORAGE_REQUEST_EVENTS, storageRequestEvents } from '../../src/events/storageRequest.events'
import {
  notificationLogger,
  registerStorageRequestNotificationListeners,
} from '../../src/events/listeners/storageRequestNotifications.listener'

// `registerAllEventListeners()` (called once via `createApp()`) is
// idempotent, so calling this directly here is safe even though every
// integration test file that imports `testApp` also triggers it.
registerStorageRequestNotificationListeners()

afterEach(() => {
  vi.restoreAllMocks()
})

describe('registerStorageRequestNotificationListeners', () => {
  it('logs a "Storage Request Approved" notification event on Approved', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    storageRequestEvents.emit(STORAGE_REQUEST_EVENTS.APPROVED, {
      storageRequestId: 'sr-1',
      requestNumber: 'SR-00001',
      farmerId: 'farmer-1',
      farmerUserId: 'user-1',
      approvedBy: 'ops-1',
      approvedAt: new Date(),
    })

    expect(spy).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ notification: 'Storage Request Approved', requestNumber: 'SR-00001' }),
      'Notification event created',
    )
  })

  it('logs a "Storage Request Rejected" notification event on Rejected', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    storageRequestEvents.emit(STORAGE_REQUEST_EVENTS.REJECTED, {
      storageRequestId: 'sr-2',
      requestNumber: 'SR-00002',
      farmerId: 'farmer-2',
      farmerUserId: 'user-2',
      rejectedBy: 'ops-1',
      rejectedAt: new Date(),
      reason: 'Below grade',
    })

    expect(spy).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ notification: 'Storage Request Rejected', reason: 'Below grade' }),
      'Notification event created',
    )
  })

  it('does not log anything for Cancelled (the farmer already knows)', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    storageRequestEvents.emit(STORAGE_REQUEST_EVENTS.CANCELLED, {
      storageRequestId: 'sr-3',
      requestNumber: 'SR-00003',
      farmerId: 'farmer-3',
      farmerUserId: 'user-3',
      cancelledBy: 'user-3',
      cancelledAt: new Date(),
      reason: null,
    })

    expect(spy).not.toHaveBeenCalled()
  })
})
