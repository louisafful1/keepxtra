import { createEventBus } from './eventBus'

/**
 * The domain events a Pickup emits at each lifecycle milestone — the same
 * extension-point pattern `storageRequest.events.ts` established. A future
 * Inventory module (Module 4) is the intended consumer of `COMPLETED`: it
 * will subscribe to auto-create an inventory record the moment produce is
 * actually completed into storage, without PickupService importing
 * anything about Inventory.
 */
export const PICKUP_EVENTS = {
  SCHEDULED: 'pickup.scheduled',
  COLLECTED: 'pickup.collected',
  COMPLETED: 'pickup.completed',
  CANCELLED: 'pickup.cancelled',
} as const

interface PickupEventBase {
  pickupId: string
  pickupNumber: string
  storageRequestId: string
  /** The Farmer business-entity id. */
  farmerId: string
  /** The linked User id — what a future NotificationService would address a Notification to. */
  farmerUserId: string
}

export interface PickupScheduledEvent extends PickupEventBase {
  scheduledDate: Date
  scheduledBy: string
}

export interface PickupCollectedEvent extends PickupEventBase {
  collectedQuantity: number
  collectedWeightKg: number
  collectedBy: string
  collectedAt: Date
}

export interface PickupCompletedEvent extends PickupEventBase {
  completedBy: string
  completedAt: Date
}

export interface PickupCancelledEvent extends PickupEventBase {
  cancelledBy: string
  cancelledAt: Date
  reason: string
}

export interface PickupEventMap {
  [PICKUP_EVENTS.SCHEDULED]: PickupScheduledEvent
  [PICKUP_EVENTS.COLLECTED]: PickupCollectedEvent
  [PICKUP_EVENTS.COMPLETED]: PickupCompletedEvent
  [PICKUP_EVENTS.CANCELLED]: PickupCancelledEvent
}

export const pickupEvents = createEventBus<PickupEventMap>()
