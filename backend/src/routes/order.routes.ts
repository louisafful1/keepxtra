import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import { cancelOrderSchema, createOrderSchema, orderListQuerySchema, updateOrderSchema } from '../validators/order.validators'
import {
  cancelOrder,
  confirmOrder,
  createOrder,
  deliverOrder,
  getOrderById,
  getOrderStatsSummary,
  listOrders,
  updateOrder,
} from '../controllers/order.controller'

export const orderRouter = Router()

orderRouter.use(authenticate)
orderRouter.use(requirePermission('sales.create'))

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Sales]
 *     summary: Create a draft order
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **sales.create**. Each item must reference an `In Stock` Inventory record that has a
 *       recorded `valuePerUnit` and enough available quantity. No stock is reserved or deducted yet —
 *       that happens on POST /orders/{id}/confirm.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, items]
 *             properties:
 *               customerId: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [inventoryId, quantity, unitPrice]
 *                   properties:
 *                     inventoryId: { type: string }
 *                     quantity: { type: number, example: 100 }
 *                     unitPrice: { type: number, example: 5.5 }
 *               deliveryAddress: { type: string }
 *               deliveryDate: { type: string, format: date }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Order created.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Order' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       404: { description: Customer or inventory record not found. }
 *       409: { description: "An item is unavailable, un-valued, or insufficiently stocked." }
 *       422: { description: Request body failed validation. }
 */
orderRouter.post('/', validateRequest({ body: createOrderSchema }), createOrder)

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Sales]
 *     summary: List orders
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **sales.create**. Supports search, filtering, sorting, and pagination."
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches order number, invoice number, or customer name.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Draft, Confirmed, Delivered, Cancelled] }
 *       - in: query
 *         name: customerId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200:
 *         description: A page of orders.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OrderListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 */
orderRouter.get('/', validateRequest({ query: orderListQuerySchema }), listOrders)

/**
 * @openapi
 * /orders/stats/summary:
 *   get:
 *     tags: [Sales]
 *     summary: Sales dashboard statistics
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **sales.create**. Revenue/earnings/profit totals only count Confirmed and Delivered orders."
 *     responses:
 *       200:
 *         description: The sales statistics.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/SalesStatsSummary' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 */
orderRouter.get('/stats/summary', getOrderStatsSummary)

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags: [Sales]
 *     summary: Get an order by id
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **sales.create**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The order.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Order' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       404: { description: Order not found. }
 */
orderRouter.get('/:id', validateRequest({ params: mongoIdParamSchema }), getOrderById)

/**
 * @openapi
 * /orders/{id}:
 *   patch:
 *     tags: [Sales]
 *     summary: Update a draft order's non-financial fields
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **sales.create**. Valid only from `Draft`. Only `deliveryAddress`/`deliveryDate`/`notes`
 *       are editable — changing items or customer requires cancelling and recreating the draft.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { deliveryAddress: { type: string }, deliveryDate: { type: string, format: date }, notes: { type: string } } }
 *     responses:
 *       200:
 *         description: The updated order.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Order' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       404: { description: Order not found. }
 *       409: { description: The order is not in a state that can be edited. }
 *       422: { description: Request body failed validation. }
 */
orderRouter.patch('/:id', validateRequest({ params: mongoIdParamSchema, body: updateOrderSchema }), updateOrder)

/**
 * @openapi
 * /orders/{id}/confirm:
 *   post:
 *     tags: [Sales]
 *     summary: Confirm an order — deducts inventory and issues an invoice
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **sales.create**. Valid only from `Draft`. Re-validates and deducts each item from its
 *       Inventory record, generates an invoice number, and emits `order.confirmed` — the extension point
 *       a future Payments module will consume to create farmer payouts.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The confirmed order.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Order' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       404: { description: Order not found. }
 *       409: { description: "The order is not in a state that can be confirmed, or an item is no longer available." }
 */
orderRouter.post('/:id/confirm', validateRequest({ params: mongoIdParamSchema }), confirmOrder)

/**
 * @openapi
 * /orders/{id}/deliver:
 *   post:
 *     tags: [Sales]
 *     summary: Mark an order as delivered
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **sales.create**. Valid only from `Confirmed`."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The delivered order.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Order' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       404: { description: Order not found. }
 *       409: { description: The order is not in a state that can be delivered. }
 */
orderRouter.post('/:id/deliver', validateRequest({ params: mongoIdParamSchema }), deliverOrder)

/**
 * @openapi
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Sales]
 *     summary: Cancel an order
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **sales.create**. Valid from `Draft` or `Confirmed` (not `Delivered`). If the order had
 *       already been confirmed, every deducted item is added back to its Inventory record.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [reason], properties: { reason: { type: string, example: "Customer changed order" } } }
 *     responses:
 *       200:
 *         description: The cancelled order.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Order' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       404: { description: Order not found. }
 *       409: { description: The order is not in a state that can be cancelled. }
 *       422: { description: Request body failed validation. }
 */
orderRouter.post('/:id/cancel', validateRequest({ params: mongoIdParamSchema, body: cancelOrderSchema }), cancelOrder)
