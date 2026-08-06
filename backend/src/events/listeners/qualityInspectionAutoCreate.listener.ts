import { logger } from '../../config/logger'
import { INVENTORY_EVENTS, inventoryEvents } from '../inventory.events'
import { qualityInspectionService } from '../../services/qualityInspection.service'

const inspectionLogger = logger.child({ module: 'quality-inspections' })

/**
 * The extension point Module 4's `INVENTORY_EVENTS.RECEIVED` doc comment
 * promised: the moment produce is physically placed in a warehouse, a
 * Quality Inspection record is born (in `Pending`, awaiting an inspector).
 *
 * Fire-and-forget, same reasoning as every other auto-create listener —
 * the `receive` HTTP response is not held up by this, and a failure here
 * is logged rather than thrown.
 */
export function registerQualityInspectionAutoCreateListener(): void {
  inventoryEvents.on(INVENTORY_EVENTS.RECEIVED, (event) => {
    qualityInspectionService.createFromReceivedInventory(event).catch((err: unknown) => {
      inspectionLogger.error({ err, inventoryId: event.inventoryId }, 'Failed to auto-create quality inspection from received inventory')
    })
  })
}
