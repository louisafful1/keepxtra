import { createEventBus } from './eventBus'

/**
 * The domain events a Storage Request emits at each terminal decision
 * point. This is the extension point the future Pickup module plugs into:
 * it will call `storageRequestEvents.on(STORAGE_REQUEST_EVENTS.APPROVED,
 * handler)` to create its own PickupRequest the moment a request is
 * approved, without StorageRequestService importing anything about Pickup.
 *
 * `SUBMITTED` is included for completeness/future consumers even though
 * nothing in this phase listens for it yet.
 */
export const STORAGE_REQUEST_EVENTS = {
  SUBMITTED: 'storageRequest.submitted',
  APPROVED: 'storageRequest.approved',
  REJECTED: 'storageRequest.rejected',
  CANCELLED: 'storageRequest.cancelled',
} as const

interface StorageRequestEventBase {
  storageRequestId: string
  requestNumber: string
  /** The Farmer business-entity id. */
  farmerId: string
  /** The linked User id — what a future NotificationService would address a Notification to. */
  farmerUserId: string
}

export interface StorageRequestSubmittedEvent extends StorageRequestEventBase {
  submittedAt: Date
}

export interface StorageRequestApprovedEvent extends StorageRequestEventBase {
  approvedBy: string
  approvedAt: Date
}

export interface StorageRequestRejectedEvent extends StorageRequestEventBase {
  rejectedBy: string
  rejectedAt: Date
  reason: string
}

export interface StorageRequestCancelledEvent extends StorageRequestEventBase {
  cancelledBy: string
  cancelledAt: Date
  reason: string | null
}

export interface StorageRequestEventMap {
  [STORAGE_REQUEST_EVENTS.SUBMITTED]: StorageRequestSubmittedEvent
  [STORAGE_REQUEST_EVENTS.APPROVED]: StorageRequestApprovedEvent
  [STORAGE_REQUEST_EVENTS.REJECTED]: StorageRequestRejectedEvent
  [STORAGE_REQUEST_EVENTS.CANCELLED]: StorageRequestCancelledEvent
}

export const storageRequestEvents = createEventBus<StorageRequestEventMap>()
