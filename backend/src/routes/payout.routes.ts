import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import { payoutListQuerySchema, processPayoutSchema, rejectPayoutSchema } from '../validators/payout.validators'
import {
  approvePayout,
  getFarmerPayoutSummary,
  getPayoutById,
  getPayoutStatsSummary,
  listPayouts,
  processPayout,
  rejectPayout,
} from '../controllers/payout.controller'

const farmerIdParamSchema = z.object({
  farmerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid farmer id format'),
})

export const payoutRouter = Router()

payoutRouter.use(authenticate)

/**
 * @openapi
 * /payouts:
 *   get:
 *     tags: [Payments]
 *     summary: List farmer payouts
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **payments.approve**. Supports search, filtering, sorting, and pagination."
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches payout code, farmer name, farmer number, or order number.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending, Approved, Paid, Rejected] }
 *       - in: query
 *         name: farmerId
 *         schema: { type: string }
 *       - in: query
 *         name: method
 *         schema: { type: string, enum: [Bank Transfer, Mobile Money] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200:
 *         description: A page of payouts.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PayoutListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the payments.approve permission." }
 */
payoutRouter.get('/', requirePermission('payments.approve'), validateRequest({ query: payoutListQuerySchema }), listPayouts)

/**
 * @openapi
 * /payouts/stats/summary:
 *   get:
 *     tags: [Payments]
 *     summary: Platform-wide payment reconciliation statistics
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **payments.approve**."
 *     responses:
 *       200:
 *         description: The payout statistics.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/PayoutStatsSummary' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the payments.approve permission." }
 */
payoutRouter.get('/stats/summary', requirePermission('payments.approve'), getPayoutStatsSummary)

/**
 * @openapi
 * /payouts/farmer/{farmerId}/summary:
 *   get:
 *     tags: [Payments]
 *     summary: A farmer's outstanding balance and total paid ("wallet balance")
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **payments.approve**."
 *     parameters:
 *       - in: path
 *         name: farmerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The farmer's payout summary.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/FarmerPayoutSummary' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the payments.approve permission." }
 *       404: { description: Farmer not found. }
 */
payoutRouter.get('/farmer/:farmerId/summary', requirePermission('payments.approve'), validateRequest({ params: farmerIdParamSchema }), getFarmerPayoutSummary)

/**
 * @openapi
 * /payouts/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get a payout by id
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **payments.approve**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The payout.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Payout' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the payments.approve permission." }
 *       404: { description: Payout not found. }
 */
payoutRouter.get('/:id', requirePermission('payments.approve'), validateRequest({ params: mongoIdParamSchema }), getPayoutById)

/**
 * @openapi
 * /payouts/{id}/approve:
 *   post:
 *     tags: [Payments]
 *     summary: Approve a pending payout
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **payments.approve**. Valid only from `Pending`."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The approved payout.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Payout' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the payments.approve permission." }
 *       404: { description: Payout not found. }
 *       409: { description: The payout is not in a state that can be approved. }
 */
payoutRouter.post('/:id/approve', requirePermission('payments.approve'), validateRequest({ params: mongoIdParamSchema }), approvePayout)

/**
 * @openapi
 * /payouts/{id}/reject:
 *   post:
 *     tags: [Payments]
 *     summary: Reject a payout
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **payments.approve**. Valid from `Pending` or `Approved`."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [reason], properties: { reason: { type: string, example: "Duplicate payout" } } }
 *     responses:
 *       200:
 *         description: The rejected payout.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Payout' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the payments.approve permission." }
 *       404: { description: Payout not found. }
 *       409: { description: The payout is not in a state that can be rejected. }
 *       422: { description: Request body failed validation. }
 */
payoutRouter.post(
  '/:id/reject',
  requirePermission('payments.approve'),
  validateRequest({ params: mongoIdParamSchema, body: rejectPayoutSchema }),
  rejectPayout,
)

/**
 * @openapi
 * /payouts/{id}/process:
 *   post:
 *     tags: [Payments]
 *     summary: Record a payout as disbursed
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **payments.process** — a separate permission from approval, so approving and
 *       disbursing funds can be split across roles. Valid only from `Approved`. Records the external
 *       bank/Mobile Money transaction id; KeepXtra does not integrate with a real payment gateway.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [method, transactionId]
 *             properties:
 *               method: { type: string, enum: [Bank Transfer, Mobile Money] }
 *               transactionId: { type: string, example: "MTN-MOMO-2026080600123" }
 *     responses:
 *       200:
 *         description: The paid payout.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Payout' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the payments.process permission." }
 *       404: { description: Payout not found. }
 *       409: { description: The payout is not in a state that can be processed. }
 *       422: { description: Request body failed validation. }
 */
payoutRouter.post(
  '/:id/process',
  requirePermission('payments.process'),
  validateRequest({ params: mongoIdParamSchema, body: processPayoutSchema }),
  processPayout,
)
