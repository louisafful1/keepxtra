import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema, paginationQuerySchema } from '../validators/common.validators'
import {
  createVehicleSchema,
  logFuelSchema,
  logMaintenanceSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  vehicleListQuerySchema,
} from '../validators/vehicle.validators'
import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  getVehicleFuelHistory,
  getVehicleMaintenanceHistory,
  getVehicleStatsSummary,
  listVehicles,
  logVehicleFuel,
  logVehicleMaintenance,
  restoreVehicle,
  updateVehicle,
  updateVehicleStatus,
} from '../controllers/vehicle.controller'

export const vehicleRouter = Router()

vehicleRouter.use(authenticate)
vehicleRouter.use(requirePermission('fleet.manage'))

/**
 * @openapi
 * /vehicles:
 *   post:
 *     tags: [Fleet]
 *     summary: Register a vehicle
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **fleet.manage**."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plateNumber, type, capacityKg]
 *             properties:
 *               plateNumber: { type: string, example: "GT 1234-24" }
 *               type: { type: string, example: "Refrigerated Truck" }
 *               make: { type: string, example: Toyota }
 *               vehicleModel: { type: string, example: Dyna }
 *               year: { type: integer, example: 2022 }
 *               capacityKg: { type: number, example: 5000 }
 *               fuelType: { type: string, example: Diesel }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Vehicle created.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Vehicle' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 *       422: { description: Request body failed validation. }
 */
vehicleRouter.post('/', validateRequest({ body: createVehicleSchema }), createVehicle)

/**
 * @openapi
 * /vehicles:
 *   get:
 *     tags: [Fleet]
 *     summary: List vehicles
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **fleet.manage**. Supports search, filtering, sorting, and pagination."
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Available, On Trip, Under Maintenance, Out of Service] }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200:
 *         description: A page of vehicles.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VehicleListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 */
vehicleRouter.get('/', validateRequest({ query: vehicleListQuerySchema }), listVehicles)

/**
 * @openapi
 * /vehicles/stats/summary:
 *   get:
 *     tags: [Fleet]
 *     summary: Fleet utilization statistics
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **fleet.manage**."
 *     responses:
 *       200:
 *         description: The fleet statistics.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/FleetStatsSummary' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 */
vehicleRouter.get('/stats/summary', getVehicleStatsSummary)

/**
 * @openapi
 * /vehicles/{id}:
 *   get:
 *     tags: [Fleet]
 *     summary: Get a vehicle by id
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **fleet.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The vehicle.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Vehicle' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 *       404: { description: Vehicle not found. }
 */
vehicleRouter.get('/:id', validateRequest({ params: mongoIdParamSchema }), getVehicleById)

/**
 * @openapi
 * /vehicles/{id}:
 *   patch:
 *     tags: [Fleet]
 *     summary: Update a vehicle
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **fleet.manage**. `vehicleCode`, `currentMileageKm`, `assignedDriverId`, and `status`
 *       are never accepted here — status changes go through PATCH /vehicles/{id}/status, mileage is
 *       derived from maintenance/fuel records, and assignment is driven from the Driver resource.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, description: Any subset of the vehicle's editable fields. }
 *     responses:
 *       200:
 *         description: The updated vehicle.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Vehicle' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 *       404: { description: Vehicle not found. }
 *       422: { description: Request body failed validation. }
 */
vehicleRouter.patch('/:id', validateRequest({ params: mongoIdParamSchema, body: updateVehicleSchema }), updateVehicle)

/**
 * @openapi
 * /vehicles/{id}/status:
 *   patch:
 *     tags: [Fleet]
 *     summary: Change a vehicle's status
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **fleet.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [status], properties: { status: { type: string, enum: [Available, On Trip, Under Maintenance, Out of Service] } } }
 *     responses:
 *       200:
 *         description: The updated vehicle.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Vehicle' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 *       404: { description: Vehicle not found. }
 *       422: { description: Request body failed validation. }
 */
vehicleRouter.patch('/:id/status', validateRequest({ params: mongoIdParamSchema, body: updateVehicleStatusSchema }), updateVehicleStatus)

/**
 * @openapi
 * /vehicles/{id}/maintenance:
 *   post:
 *     tags: [Fleet]
 *     summary: Log a maintenance record
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **fleet.manage**. Advances `currentMileageKm` if `odometerKm` is higher than what's on file."
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
 *             required: [type, description, performedAt]
 *             properties:
 *               type: { type: string, enum: [Service, Repair, Inspection] }
 *               description: { type: string, example: "Replaced brake pads" }
 *               costAmount: { type: number, example: 450 }
 *               odometerKm: { type: number, example: 52000 }
 *               performedAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: The logged maintenance record.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/MaintenanceRecord' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 *       404: { description: Vehicle not found. }
 *       422: { description: Request body failed validation. }
 */
vehicleRouter.post('/:id/maintenance', validateRequest({ params: mongoIdParamSchema, body: logMaintenanceSchema }), logVehicleMaintenance)

/**
 * @openapi
 * /vehicles/{id}/maintenance:
 *   get:
 *     tags: [Fleet]
 *     summary: Maintenance history for a vehicle
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **fleet.manage**. Newest first."
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
 *         description: A page of maintenance records.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MaintenanceRecordListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 *       404: { description: Vehicle not found. }
 */
vehicleRouter.get(
  '/:id/maintenance',
  validateRequest({ params: mongoIdParamSchema, query: paginationQuerySchema }),
  getVehicleMaintenanceHistory,
)

/**
 * @openapi
 * /vehicles/{id}/fuel:
 *   post:
 *     tags: [Fleet]
 *     summary: Log a fuel record
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **fleet.manage**. Advances `currentMileageKm` if `odometerKm` is higher than what's on file."
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
 *             required: [litres, costAmount, odometerKm, recordedAt]
 *             properties:
 *               litres: { type: number, example: 60 }
 *               costAmount: { type: number, example: 480 }
 *               odometerKm: { type: number, example: 52200 }
 *               recordedAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: The logged fuel record.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/FuelRecord' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 *       404: { description: Vehicle not found. }
 *       422: { description: Request body failed validation. }
 */
vehicleRouter.post('/:id/fuel', validateRequest({ params: mongoIdParamSchema, body: logFuelSchema }), logVehicleFuel)

/**
 * @openapi
 * /vehicles/{id}/fuel:
 *   get:
 *     tags: [Fleet]
 *     summary: Fuel history for a vehicle
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **fleet.manage**. Newest first."
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
 *         description: A page of fuel records.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/FuelRecordListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 *       404: { description: Vehicle not found. }
 */
vehicleRouter.get('/:id/fuel', validateRequest({ params: mongoIdParamSchema, query: paginationQuerySchema }), getVehicleFuelHistory)

/**
 * @openapi
 * /vehicles/{id}:
 *   delete:
 *     tags: [Fleet]
 *     summary: Soft-delete a vehicle
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **fleet.manage**. Refuses to delete a vehicle that is currently On Trip."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Vehicle soft-deleted. }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 *       404: { description: Vehicle not found. }
 *       409: { description: The vehicle is currently On Trip. }
 */
vehicleRouter.delete('/:id', validateRequest({ params: mongoIdParamSchema }), deleteVehicle)

/**
 * @openapi
 * /vehicles/{id}/restore:
 *   post:
 *     tags: [Fleet]
 *     summary: Restore a soft-deleted vehicle
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **fleet.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The restored vehicle.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Vehicle' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the fleet.manage permission." }
 *       404: { description: No deleted vehicle found with this id. }
 */
vehicleRouter.post('/:id/restore', validateRequest({ params: mongoIdParamSchema }), restoreVehicle)
