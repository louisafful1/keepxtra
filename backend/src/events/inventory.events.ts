import { createEventBus } from './eventBus'

/**
 * The extension point a future Quality Inspection module (a later phase)
 * will consume: the moment produce is physically placed in a warehouse, it
 * needs inspecting. Kept to a single event for now — nothing in this phase
 * has a second consumer yet.
 */
export const INVENTORY_EVENTS = {
  RECEIVED: 'inventory.received',
} as const

export interface InventoryReceivedEvent {
  inventoryId: string
  inventoryCode: string
  farmerId: string
  farmerUserId: string
  produceType: string
  warehouseId: string
  coldRoomId: string | null
  receivedBy: string
  receivedAt: Date
}

export interface InventoryEventMap {
  [INVENTORY_EVENTS.RECEIVED]: InventoryReceivedEvent
}

export const inventoryEvents = createEventBus<InventoryEventMap>()
