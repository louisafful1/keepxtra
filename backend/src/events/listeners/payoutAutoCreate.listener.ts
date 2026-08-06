import { logger } from '../../config/logger'
import { ORDER_EVENTS, orderEvents } from '../order.events'
import { payoutService } from '../../services/payout.service'

const payoutLogger = logger.child({ module: 'payouts' })

/**
 * The extension point Module 7's `ORDER_EVENTS.CONFIRMED` doc comment
 * promised: the moment an order is confirmed, one Payout is born per
 * farmer represented in it (in `Pending`, awaiting approval).
 *
 * Fire-and-forget, same reasoning as every other auto-create listener —
 * the `confirm` HTTP response is not held up by this, and a failure here
 * is logged rather than thrown.
 */
export function registerPayoutAutoCreateListener(): void {
  orderEvents.on(ORDER_EVENTS.CONFIRMED, (event) => {
    payoutService.createFromConfirmedOrder(event).catch((err: unknown) => {
      payoutLogger.error({ err, orderId: event.orderId }, 'Failed to auto-create payouts from confirmed order')
    })
  })
}
