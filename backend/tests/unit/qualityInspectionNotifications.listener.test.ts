import { describe, expect, it, vi, afterEach } from 'vitest'
import { QUALITY_INSPECTION_EVENTS, qualityInspectionEvents } from '../../src/events/qualityInspection.events'
import {
  notificationLogger,
  registerQualityInspectionNotificationListeners,
} from '../../src/events/listeners/qualityInspectionNotifications.listener'

// `registerAllEventListeners()` (called once via `createApp()`) is
// idempotent, so calling this directly here is safe even though every
// integration test file that imports `testApp` also triggers it.
registerQualityInspectionNotificationListeners()

afterEach(() => {
  vi.restoreAllMocks()
})

describe('registerQualityInspectionNotificationListeners', () => {
  it('logs a status-specific notification event on Completed', () => {
    const spy = vi.spyOn(notificationLogger, 'info')

    qualityInspectionEvents.emit(QUALITY_INSPECTION_EVENTS.COMPLETED, {
      inspectionId: 'insp-1',
      inspectionCode: 'QI-00001',
      inventoryId: 'inv-1',
      farmerId: 'farmer-1',
      farmerUserId: 'user-1',
      status: 'Partially Accepted',
      qualityGrade: 'B',
      acceptedQuantity: 450,
      rejectedQuantity: 30,
      inspectedBy: 'ops-1',
      inspectedAt: new Date(),
    })

    expect(spy).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ notification: 'Quality Inspection Partially Accepted', qualityGrade: 'B' }),
      'Notification event created',
    )
  })
})
