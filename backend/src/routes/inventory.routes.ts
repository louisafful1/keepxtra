import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import {
  adjustInventorySchema,
  disposeInventorySchema,
  inventoryListQuerySchema,
  movementListQuerySchema,
  receiveInventorySchema,
  transferInventorySchema,
} from '../validators/inventory.validators'
import {
  adjustInventory,
  disposeInventory,
  getInventoryById,
  getInventoryIntelligenceSummary,
  getInventoryMovements,
  listInventory,
  receiveInventory,
  transferInventory,
} from '../controllers/inventory.controller'

export const inventoryRouter = Router()

inventoryRouter.use(authenticate)

/**
 * @openapi
 * /inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: List inventory records
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **inventory.view**. Supports search, filtering (including computed `nearExpiry`/`expired`/`lowStock` flags), sorting, and pagination."
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches inventory code, request number, farmer name, farmer number, produce type, or warehouse.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending Placement, In Stock, Depleted, Disposed] }
 *       - in: query
 *         name: produceType
 *         schema: { type: string }
 *       - in: query
 *         name: warehouseId
 *         schema: { type: string }
 *       - in: query
 *         name: nearExpiry
 *         schema: { type: boolean }
 *       - in: query
 *         name: expired
 *         schema: { type: boolean }
 *       - in: query
 *         name: lowStock
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 25 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: sortDir
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: A page of inventory records.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/InventoryListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inventory.view permission." }
 */
inventoryRouter.get('/', requirePermission('inventory.view'), validateRequest({ query: inventoryListQuerySchema }), listInventory)

/**
 * @openapi
 * /inventory/intelligence/summary:
 *   get:
 *     tags: [Inventory]
 *     summary: Dashboard-level inventory intelligence — low stock, near expiry, expired, and overstocked storage locations
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **inventory.view**."
 *     responses:
 *       200:
 *         description: The intelligence summary.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/InventoryIntelligenceSummary' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inventory.view permission." }
 */
inventoryRouter.get('/intelligence/summary', requirePermission('inventory.view'), getInventoryIntelligenceSummary)

/**
 * @openapi
 * /inventory/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get an inventory record by id
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **inventory.view**. The response includes computed `isExpired`/`isNearExpiry`/`isLowStock` flags and `availableQuantity`/`totalValue`."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The inventory record.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Inventory' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inventory.view permission." }
 *       404: { description: Inventory record not found. }
 */
inventoryRouter.get('/:id', requirePermission('inventory.view'), validateRequest({ params: mongoIdParamSchema }), getInventoryById)

/**
 * @openapi
 * /inventory/{id}/movements:
 *   get:
 *     tags: [Inventory]
 *     summary: Stock movement history for an inventory record
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **inventory.view**. Newest first."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200:
 *         description: A page of movements.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/InventoryMovementListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inventory.view permission." }
 *       404: { description: Inventory record not found. }
 */
inventoryRouter.get(
  '/:id/movements',
  requirePermission('inventory.view'),
  validateRequest({ params: mongoIdParamSchema, query: movementListQuerySchema }),
  getInventoryMovements,
)

/**
 * @openapi
 * /inventory/{id}/receive:
 *   post:
 *     tags: [Inventory]
 *     summary: Assign a warehouse/cold room and place produce into stock
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **inventory.manage**. Valid only from `Pending Placement`. Computes `expiryDate` from
 *       the storage request's harvest date plus `shelfLifeDays`, and logs a `Receipt` movement.
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
 *             required: [warehouseId, shelfLifeDays]
 *             properties:
 *               warehouseId: { type: string }
 *               coldRoomId: { type: string }
 *               shelfLifeDays: { type: integer, example: 14 }
 *               valuePerUnit: { type: number, example: 3.5 }
 *     responses:
 *       200:
 *         description: The received inventory record.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Inventory' } } }
 *       400: { description: The cold room does not belong to the given warehouse. }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inventory.manage permission." }
 *       404: { description: "Inventory record, warehouse, or cold room not found." }
 *       409: { description: The record is not in a state that can be received. }
 *       422: { description: Request body failed validation. }
 */
inventoryRouter.post(
  '/:id/receive',
  requirePermission('inventory.manage'),
  validateRequest({ params: mongoIdParamSchema, body: receiveInventorySchema }),
  receiveInventory,
)

/**
 * @openapi
 * /inventory/{id}/adjust:
 *   patch:
 *     tags: [Inventory]
 *     summary: Adjust recorded quantity (correction, spoilage found in count, etc.)
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **inventory.manage**. Valid only from `In Stock`. `quantityChange` may be positive or
 *       negative; reaching exactly 0 moves the record to `Depleted`. Logs an `Adjustment` movement.
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
 *             required: [quantityChange, reason]
 *             properties: { quantityChange: { type: number, example: -25 }, reason: { type: string, example: "Recount correction" } }
 *     responses:
 *       200:
 *         description: The adjusted inventory record.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Inventory' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inventory.manage permission." }
 *       404: { description: Inventory record not found. }
 *       409: { description: "The record is not in a state that can be adjusted, or the adjustment is invalid." }
 *       422: { description: Request body failed validation. }
 */
inventoryRouter.patch(
  '/:id/adjust',
  requirePermission('inventory.manage'),
  validateRequest({ params: mongoIdParamSchema, body: adjustInventorySchema }),
  adjustInventory,
)

/**
 * @openapi
 * /inventory/{id}/transfer:
 *   post:
 *     tags: [Inventory]
 *     summary: Relocate an inventory record to a different warehouse/cold room
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **inventory.manage**. Valid only from `In Stock`. Logs a `Transfer` movement."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [warehouseId], properties: { warehouseId: { type: string }, coldRoomId: { type: string } } }
 *     responses:
 *       200:
 *         description: The transferred inventory record.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Inventory' } } }
 *       400: { description: The cold room does not belong to the given warehouse. }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inventory.manage permission." }
 *       404: { description: "Inventory record, warehouse, or cold room not found." }
 *       409: { description: The record is not in a state that can be transferred. }
 *       422: { description: Request body failed validation. }
 */
inventoryRouter.post(
  '/:id/transfer',
  requirePermission('inventory.manage'),
  validateRequest({ params: mongoIdParamSchema, body: transferInventorySchema }),
  transferInventory,
)

/**
 * @openapi
 * /inventory/{id}/dispose:
 *   post:
 *     tags: [Inventory]
 *     summary: Dispose of spoiled/damaged stock
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **inventory.manage**. Valid only from `In Stock`. Zeroes the quantity and logs a `Disposal` movement."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [reason], properties: { reason: { type: string, example: "Mold found during inspection" } } }
 *     responses:
 *       200:
 *         description: The disposed inventory record.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Inventory' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inventory.manage permission." }
 *       404: { description: Inventory record not found. }
 *       409: { description: The record is not in a state that can be disposed. }
 *       422: { description: Request body failed validation. }
 */
inventoryRouter.post(
  '/:id/dispose',
  requirePermission('inventory.manage'),
  validateRequest({ params: mongoIdParamSchema, body: disposeInventorySchema }),
  disposeInventory,
)
