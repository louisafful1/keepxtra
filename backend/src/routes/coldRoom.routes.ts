import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import {
  adjustOccupancySchema,
  coldRoomListQuerySchema,
  createColdRoomSchema,
  recordReadingSchema,
  updateColdRoomSchema,
  updateColdRoomStatusSchema,
} from '../validators/coldRoom.validators'
import {
  adjustColdRoomOccupancy,
  createColdRoom,
  deleteColdRoom,
  getColdRoomById,
  getColdRoomStatsSummary,
  listColdRooms,
  recordColdRoomReading,
  restoreColdRoom,
  updateColdRoom,
  updateColdRoomStatus,
} from '../controllers/coldRoom.controller'

export const coldRoomRouter = Router()

coldRoomRouter.use(authenticate)
// Cold rooms have no farmer-facing surface — the catalogue's
// **warehouses.manage** permission explicitly covers "warehouses and cold
// rooms", so every route here is gated by it rather than a new key.
coldRoomRouter.use(requirePermission('warehouses.manage'))

/**
 * @openapi
 * /cold-rooms:
 *   post:
 *     tags: [Cold Rooms]
 *     summary: Create a cold room inside a warehouse
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**. `warehouseId` must reference an existing warehouse."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, name, capacityKg, targetTemperatureMinC, targetTemperatureMaxC, targetHumidityMinPercent, targetHumidityMaxPercent]
 *             properties:
 *               warehouseId: { type: string }
 *               name: { type: string, example: "Cold Room 1" }
 *               capacityKg: { type: number, example: 8000 }
 *               targetTemperatureMinC: { type: number, example: 0 }
 *               targetTemperatureMaxC: { type: number, example: 4 }
 *               targetHumidityMinPercent: { type: number, example: 85 }
 *               targetHumidityMaxPercent: { type: number, example: 95 }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Cold room created.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/ColdRoom' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Warehouse not found. }
 *       422: { description: Request body failed validation. }
 */
coldRoomRouter.post('/', validateRequest({ body: createColdRoomSchema }), createColdRoom)

/**
 * @openapi
 * /cold-rooms:
 *   get:
 *     tags: [Cold Rooms]
 *     summary: List cold rooms
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**. Supports search, filtering, sorting, and pagination."
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches cold room code, name, warehouse code, or warehouse name.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Active, Inactive, Under Maintenance] }
 *       - in: query
 *         name: warehouseId
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
 *         description: A page of cold rooms.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ColdRoomListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 */
coldRoomRouter.get('/', validateRequest({ query: coldRoomListQuerySchema }), listColdRooms)

/**
 * @openapi
 * /cold-rooms/stats/summary:
 *   get:
 *     tags: [Cold Rooms]
 *     summary: Aggregate capacity/occupancy/alert statistics across every cold room
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**."
 *     responses:
 *       200:
 *         description: The aggregate statistics.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/ColdRoomStatsSummary' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 */
coldRoomRouter.get('/stats/summary', getColdRoomStatsSummary)

/**
 * @openapi
 * /cold-rooms/{id}:
 *   get:
 *     tags: [Cold Rooms]
 *     summary: Get a cold room by id
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**. The response includes computed `alerts` for any reading currently outside the target range."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The cold room.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/ColdRoom' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Cold room not found. }
 */
coldRoomRouter.get('/:id', validateRequest({ params: mongoIdParamSchema }), getColdRoomById)

/**
 * @openapi
 * /cold-rooms/{id}:
 *   patch:
 *     tags: [Cold Rooms]
 *     summary: Update a cold room
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **warehouses.manage**. `warehouseId`, `coldRoomCode`, current readings, and `status`
 *       are never accepted here — status changes go through PATCH /cold-rooms/{id}/status, readings
 *       through PATCH /cold-rooms/{id}/readings, and occupancy through PATCH /cold-rooms/{id}/occupancy.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, description: Any subset of the cold room's editable fields. }
 *     responses:
 *       200:
 *         description: The updated cold room.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/ColdRoom' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Cold room not found. }
 *       409: { description: New capacity/target range conflicts with current state. }
 *       422: { description: Request body failed validation. }
 */
coldRoomRouter.patch('/:id', validateRequest({ params: mongoIdParamSchema, body: updateColdRoomSchema }), updateColdRoom)

/**
 * @openapi
 * /cold-rooms/{id}/status:
 *   patch:
 *     tags: [Cold Rooms]
 *     summary: Change a cold room's status
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
 *         description: The updated cold room.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/ColdRoom' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Cold room not found. }
 *       422: { description: Request body failed validation. }
 */
coldRoomRouter.patch('/:id/status', validateRequest({ params: mongoIdParamSchema, body: updateColdRoomStatusSchema }), updateColdRoomStatus)

/**
 * @openapi
 * /cold-rooms/{id}/readings:
 *   patch:
 *     tags: [Cold Rooms]
 *     summary: Record a temperature/humidity reading
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **warehouses.manage**. At least one of `temperatureC`/`humidityPercent` is required.
 *       The reading is always accepted — an out-of-range value is surfaced via the response's `alerts`
 *       array and an "Alert" audit log entry, not rejected.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { temperatureC: { type: number, example: 2.5 }, humidityPercent: { type: number, example: 90 } } }
 *     responses:
 *       200:
 *         description: The updated cold room, including any computed alerts.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/ColdRoom' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Cold room not found. }
 *       422: { description: Request body failed validation. }
 */
coldRoomRouter.patch('/:id/readings', validateRequest({ params: mongoIdParamSchema, body: recordReadingSchema }), recordColdRoomReading)

/**
 * @openapi
 * /cold-rooms/{id}/occupancy:
 *   patch:
 *     tags: [Cold Rooms]
 *     summary: Adjust recorded occupancy (a stand-in until the Inventory module drives this automatically)
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
 *           schema: { type: object, required: [occupancyKg], properties: { occupancyKg: { type: number } } }
 *     responses:
 *       200:
 *         description: The updated cold room.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/ColdRoom' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Cold room not found. }
 *       409: { description: Occupancy would exceed capacity. }
 *       422: { description: Request body failed validation. }
 */
coldRoomRouter.patch('/:id/occupancy', validateRequest({ params: mongoIdParamSchema, body: adjustOccupancySchema }), adjustColdRoomOccupancy)

/**
 * @openapi
 * /cold-rooms/{id}:
 *   delete:
 *     tags: [Cold Rooms]
 *     summary: Soft-delete a cold room
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**. Refuses to delete a cold room that still has recorded occupancy."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Cold room soft-deleted. }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: Cold room not found. }
 *       409: { description: The cold room still has recorded occupancy. }
 */
coldRoomRouter.delete('/:id', validateRequest({ params: mongoIdParamSchema }), deleteColdRoom)

/**
 * @openapi
 * /cold-rooms/{id}/restore:
 *   post:
 *     tags: [Cold Rooms]
 *     summary: Restore a soft-deleted cold room
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **warehouses.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The restored cold room.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/ColdRoom' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the warehouses.manage permission." }
 *       404: { description: No deleted cold room found with this id. }
 */
coldRoomRouter.post('/:id/restore', validateRequest({ params: mongoIdParamSchema }), restoreColdRoom)
