import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import {
  adjustOccupancySchema,
  createWarehouseSchema,
  updateWarehouseSchema,
  updateWarehouseStatusSchema,
  warehouseListQuerySchema,
} from '../validators/warehouse.validators'
import {
  adjustWarehouseOccupancy,
  createWarehouse,
  deleteWarehouse,
  getWarehouseById,
  getWarehouseStats,
  getWarehouseStatsSummary,
  listWarehouses,
  restoreWarehouse,
  updateWarehouse,
  updateWarehouseStatus,
} from '../controllers/warehouse.controller'

export const warehouseRouter = Router()

warehouseRouter.use(authenticate)
// Warehouses have no farmer-facing surface at all — every route requires
// the single **warehouses.manage** permission the catalogue defines for
// this module, unlike Storage Requests/Pickups which split ownership vs
// permission-gated access.
warehouseRouter.use(requirePermission('warehouses.manage'))

/**
 * @openapi
 * /warehouses:
 *   post:
 *     tags: [Warehouses]
 *     summary: Create a warehouse
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**. The sum of zone capacities cannot exceed `totalCapacityKg`."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location, district, region, totalCapacityKg]
 *             properties:
 *               name: { type: string, example: "Nsawam Cold Store" }
 *               location: { type: string, example: "Plot 12, Industrial Area" }
 *               district: { type: string, example: Nsawam-Adoagyiri }
 *               region: { type: string, example: Eastern }
 *               gpsCoordinates: { type: object, properties: { lat: { type: number }, lng: { type: number } } }
 *               totalCapacityKg: { type: number, example: 50000 }
 *               zones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, capacityKg]
 *                   properties: { name: { type: string, example: "Zone A" }, capacityKg: { type: number }, currentOccupancyKg: { type: number } }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Warehouse created.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Warehouse' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       409: { description: Zone capacities exceed the total capacity. }
 *       422: { description: Request body failed validation. }
 */
warehouseRouter.post('/', validateRequest({ body: createWarehouseSchema }), createWarehouse)

/**
 * @openapi
 * /warehouses:
 *   get:
 *     tags: [Warehouses]
 *     summary: List warehouses
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**. Supports search, filtering, sorting, and pagination."
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches warehouse code, name, location, district, or region.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Active, Inactive, Under Maintenance] }
 *       - in: query
 *         name: region
 *         schema: { type: string }
 *       - in: query
 *         name: district
 *         schema: { type: string }
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
 *         description: A page of warehouses.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WarehouseListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 */
warehouseRouter.get('/', validateRequest({ query: warehouseListQuerySchema }), listWarehouses)

/**
 * @openapi
 * /warehouses/stats/summary:
 *   get:
 *     tags: [Warehouses]
 *     summary: Aggregate capacity/occupancy statistics across every warehouse
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**. Dashboard-level summary — total capacity, total occupancy, and a count by status."
 *     responses:
 *       200:
 *         description: The aggregate statistics.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/WarehouseStatsSummary' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 */
warehouseRouter.get('/stats/summary', getWarehouseStatsSummary)

/**
 * @openapi
 * /warehouses/{id}:
 *   get:
 *     tags: [Warehouses]
 *     summary: Get a warehouse by id
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The warehouse.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Warehouse' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Warehouse not found. }
 */
warehouseRouter.get('/:id', validateRequest({ params: mongoIdParamSchema }), getWarehouseById)

/**
 * @openapi
 * /warehouses/{id}/stats:
 *   get:
 *     tags: [Warehouses]
 *     summary: Capacity/occupancy statistics for one warehouse, including a per-zone breakdown
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The warehouse's statistics.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/WarehouseStats' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Warehouse not found. }
 */
warehouseRouter.get('/:id/stats', validateRequest({ params: mongoIdParamSchema }), getWarehouseStats)

/**
 * @openapi
 * /warehouses/{id}:
 *   patch:
 *     tags: [Warehouses]
 *     summary: Update a warehouse
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **warehouses.manage**. `warehouseCode`, `currentOccupancyKg`, and `status` are never
 *       accepted here — status changes go through PATCH /warehouses/{id}/status and occupancy through
 *       PATCH /warehouses/{id}/occupancy. Replacing `zones` recomputes `currentOccupancyKg` as the sum
 *       of the new zones' occupancy.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, description: Any subset of the warehouse's editable fields. }
 *     responses:
 *       200:
 *         description: The updated warehouse.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Warehouse' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Warehouse not found. }
 *       409: { description: Zone capacities exceed the total capacity. }
 *       422: { description: Request body failed validation. }
 */
warehouseRouter.patch('/:id', validateRequest({ params: mongoIdParamSchema, body: updateWarehouseSchema }), updateWarehouse)

/**
 * @openapi
 * /warehouses/{id}/status:
 *   patch:
 *     tags: [Warehouses]
 *     summary: Change a warehouse's status
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [status], properties: { status: { type: string, enum: [Active, Inactive, Under Maintenance] } } }
 *     responses:
 *       200:
 *         description: The updated warehouse.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Warehouse' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Warehouse not found. }
 *       422: { description: Request body failed validation. }
 */
warehouseRouter.patch('/:id/status', validateRequest({ params: mongoIdParamSchema, body: updateWarehouseStatusSchema }), updateWarehouseStatus)

/**
 * @openapi
 * /warehouses/{id}/occupancy:
 *   patch:
 *     tags: [Warehouses]
 *     summary: Adjust recorded occupancy (a stand-in until the Inventory module drives this automatically)
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **warehouses.manage**. `zoneId` is required if the warehouse has zones (each zone
 *       tracks its own occupancy, and the warehouse total is the sum) and forbidden otherwise.
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
 *             required: [occupancyKg]
 *             properties: { zoneId: { type: string }, occupancyKg: { type: number } }
 *     responses:
 *       200:
 *         description: The updated warehouse.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Warehouse' } } }
 *       400: { description: zoneId requirement mismatch for this warehouse's zone configuration. }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Warehouse or zone not found. }
 *       409: { description: Occupancy would exceed capacity. }
 *       422: { description: Request body failed validation. }
 */
warehouseRouter.patch('/:id/occupancy', validateRequest({ params: mongoIdParamSchema, body: adjustOccupancySchema }), adjustWarehouseOccupancy)

/**
 * @openapi
 * /warehouses/{id}:
 *   delete:
 *     tags: [Warehouses]
 *     summary: Soft-delete a warehouse
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**. Refuses to delete a warehouse that still has recorded occupancy."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Warehouse soft-deleted. }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Warehouse not found. }
 *       409: { description: The warehouse still has recorded occupancy. }
 */
warehouseRouter.delete('/:id', validateRequest({ params: mongoIdParamSchema }), deleteWarehouse)

/**
 * @openapi
 * /warehouses/{id}/restore:
 *   post:
 *     tags: [Warehouses]
 *     summary: Restore a soft-deleted warehouse
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The restored warehouse.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Warehouse' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: No deleted warehouse found with this id. }
 */
warehouseRouter.post('/:id/restore', validateRequest({ params: mongoIdParamSchema }), restoreWarehouse)
