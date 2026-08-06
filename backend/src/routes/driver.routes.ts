import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import {
  assignVehicleSchema,
  createDriverSchema,
  driverListQuerySchema,
  logTripSchema,
  updateDriverSchema,
  updateDriverStatusSchema,
} from '../validators/driver.validators'
import {
  assignDriverVehicle,
  createDriver,
  deleteDriver,
  getDriverById,
  listDrivers,
  logDriverTrip,
  restoreDriver,
  updateDriver,
  updateDriverStatus,
} from '../controllers/driver.controller'

export const driverRouter = Router()

driverRouter.use(authenticate)
driverRouter.use(requirePermission('drivers.manage'))

/**
 * @openapi
 * /drivers:
 *   post:
 *     tags: [Fleet]
 *     summary: Register a driver
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **drivers.manage**."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, licenseNumber, licenseExpiryDate]
 *             properties:
 *               name: { type: string, example: "Kofi Mensah" }
 *               phone: { type: string, example: "+233 24 222 2222" }
 *               licenseNumber: { type: string, example: "GHA-DL-00123" }
 *               licenseExpiryDate: { type: string, format: date }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Driver created.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Driver' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the drivers.manage permission." }
 *       422: { description: Request body failed validation. }
 */
driverRouter.post('/', validateRequest({ body: createDriverSchema }), createDriver)

/**
 * @openapi
 * /drivers:
 *   get:
 *     tags: [Fleet]
 *     summary: List drivers
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **drivers.manage**. Supports search, filtering, sorting, and pagination."
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Available, On Trip, Off Duty, Suspended] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200:
 *         description: A page of drivers.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DriverListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the drivers.manage permission." }
 */
driverRouter.get('/', validateRequest({ query: driverListQuerySchema }), listDrivers)

/**
 * @openapi
 * /drivers/{id}:
 *   get:
 *     tags: [Fleet]
 *     summary: Get a driver by id
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **drivers.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The driver.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Driver' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the drivers.manage permission." }
 *       404: { description: Driver not found. }
 */
driverRouter.get('/:id', validateRequest({ params: mongoIdParamSchema }), getDriverById)

/**
 * @openapi
 * /drivers/{id}:
 *   patch:
 *     tags: [Fleet]
 *     summary: Update a driver
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **drivers.manage**. `driverCode`, `assignedVehicleId`, `totalTripsCompleted`, and
 *       `status` are never accepted here — status changes go through PATCH /drivers/{id}/status,
 *       assignment through POST /drivers/{id}/assign-vehicle, and trip counts through
 *       POST /drivers/{id}/trips.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, description: Any subset of the driver's editable fields. }
 *     responses:
 *       200:
 *         description: The updated driver.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Driver' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the drivers.manage permission." }
 *       404: { description: Driver not found. }
 *       422: { description: Request body failed validation. }
 */
driverRouter.patch('/:id', validateRequest({ params: mongoIdParamSchema, body: updateDriverSchema }), updateDriver)

/**
 * @openapi
 * /drivers/{id}/status:
 *   patch:
 *     tags: [Fleet]
 *     summary: Change a driver's status
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **drivers.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [status], properties: { status: { type: string, enum: [Available, On Trip, Off Duty, Suspended] } } }
 *     responses:
 *       200:
 *         description: The updated driver.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Driver' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the drivers.manage permission." }
 *       404: { description: Driver not found. }
 *       422: { description: Request body failed validation. }
 */
driverRouter.patch('/:id/status', validateRequest({ params: mongoIdParamSchema, body: updateDriverStatusSchema }), updateDriverStatus)

/**
 * @openapi
 * /drivers/{id}/assign-vehicle:
 *   post:
 *     tags: [Fleet]
 *     summary: Assign or unassign this driver's vehicle
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **drivers.manage**. Pass `vehicleId: null` to unassign. Assigning a vehicle already
 *       held by another driver reassigns it (freeing the previous driver); assigning this driver a new
 *       vehicle first frees whatever they previously had.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [vehicleId], properties: { vehicleId: { type: string, nullable: true } } }
 *     responses:
 *       200:
 *         description: The updated driver.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Driver' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the drivers.manage permission." }
 *       404: { description: Driver or vehicle not found. }
 *       422: { description: Request body failed validation. }
 */
driverRouter.post('/:id/assign-vehicle', validateRequest({ params: mongoIdParamSchema, body: assignVehicleSchema }), assignDriverVehicle)

/**
 * @openapi
 * /drivers/{id}/trips:
 *   post:
 *     tags: [Fleet]
 *     summary: Log a completed trip (driver performance tracking)
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **drivers.manage**. Increments `totalTripsCompleted`; `rating` (if given) replaces `performanceRating`."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { rating: { type: number, minimum: 0, maximum: 5 }, notes: { type: string } } }
 *     responses:
 *       200:
 *         description: The updated driver.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Driver' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the drivers.manage permission." }
 *       404: { description: Driver not found. }
 *       422: { description: Request body failed validation. }
 */
driverRouter.post('/:id/trips', validateRequest({ params: mongoIdParamSchema, body: logTripSchema }), logDriverTrip)

/**
 * @openapi
 * /drivers/{id}:
 *   delete:
 *     tags: [Fleet]
 *     summary: Soft-delete a driver
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **drivers.manage**. Refuses to delete a driver who is currently On Trip."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Driver soft-deleted. }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the drivers.manage permission." }
 *       404: { description: Driver not found. }
 *       409: { description: The driver is currently On Trip. }
 */
driverRouter.delete('/:id', validateRequest({ params: mongoIdParamSchema }), deleteDriver)

/**
 * @openapi
 * /drivers/{id}/restore:
 *   post:
 *     tags: [Fleet]
 *     summary: Restore a soft-deleted driver
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **drivers.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The restored driver.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Driver' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the drivers.manage permission." }
 *       404: { description: No deleted driver found with this id. }
 */
driverRouter.post('/:id/restore', validateRequest({ params: mongoIdParamSchema }), restoreDriver)
