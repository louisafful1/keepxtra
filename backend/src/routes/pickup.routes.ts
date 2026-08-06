import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import {
  cancelPickupSchema,
  collectPickupSchema,
  pickupListQuerySchema,
  schedulePickupSchema,
  updateRouteNotesSchema,
} from '../validators/pickup.validators'
import {
  arrivePickup,
  cancelPickup,
  collectPickup,
  completePickup,
  getPickupById,
  listPickups,
  schedulePickup,
  startPickup,
  updatePickupRouteNotes,
} from '../controllers/pickup.controller'

export const pickupRouter = Router()

pickupRouter.use(authenticate)

/**
 * @openapi
 * /pickups:
 *   get:
 *     tags: [Pickups]
 *     summary: List pickups
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Operations/Driver users with **pickups.manage** see every pickup and may filter/search freely.
 *       Farmers (no such permission) are automatically scoped to pickups for their own storage requests.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches pickup number, request number, farmer name, farmer number, produce type, driver name, district, or region.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending, Scheduled, En Route, Arrived, Collected, Completed, Cancelled] }
 *       - in: query
 *         name: produceType
 *         schema: { type: string }
 *       - in: query
 *         name: region
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: createdAt range start.
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: scheduledDateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: scheduledDateTo
 *         schema: { type: string, format: date }
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
 *         description: A page of pickups.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PickupListResponse' }
 *       401: { description: Not authenticated. }
 */
pickupRouter.get('/', validateRequest({ query: pickupListQuerySchema }), listPickups)

/**
 * @openapi
 * /pickups/{id}:
 *   get:
 *     tags: [Pickups]
 *     summary: Get a pickup by id
 *     security: [{ bearerAuth: [] }]
 *     description: Allowed for Operations/Driver users with **pickups.manage**, or the farmer who owns the underlying storage request.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The pickup.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Pickup' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: Not permitted to view this pickup. }
 *       404: { description: Pickup not found. }
 */
pickupRouter.get('/:id', validateRequest({ params: mongoIdParamSchema }), getPickupById)

/**
 * @openapi
 * /pickups/{id}/schedule:
 *   post:
 *     tags: [Pickups]
 *     summary: Assign a driver/vehicle and schedule a pickup
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Operations-only — requires **pickups.manage**. Valid from `Pending` (first scheduling) or
 *       `Scheduled` (reschedule). The first successful schedule advances the linked Storage Request
 *       from `Approved` to `Pickup Scheduled`.
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
 *             required: [scheduledDate, scheduledTime, driverName, driverPhone, vehiclePlateNumber, vehicleType]
 *             properties:
 *               scheduledDate: { type: string, format: date }
 *               scheduledTime: { type: string, example: "09:00" }
 *               driverName: { type: string, example: "Kofi Mensah" }
 *               driverPhone: { type: string, example: "+233 24 222 2222" }
 *               vehiclePlateNumber: { type: string, example: "GT 1234-24" }
 *               vehicleType: { type: string, example: "Refrigerated Truck" }
 *               routeNotes: { type: string }
 *     responses:
 *       200:
 *         description: The scheduled pickup.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Pickup' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the pickups.manage permission." }
 *       404: { description: Pickup not found. }
 *       409: { description: The pickup is not in a state that can be scheduled. }
 *       422: { description: Request body failed validation. }
 */
pickupRouter.post(
  '/:id/schedule',
  requirePermission('pickups.manage'),
  validateRequest({ params: mongoIdParamSchema, body: schedulePickupSchema }),
  schedulePickup,
)

/**
 * @openapi
 * /pickups/{id}/start:
 *   post:
 *     tags: [Pickups]
 *     summary: Mark a pickup as en route
 *     security: [{ bearerAuth: [] }]
 *     description: "Operations-only — requires **pickups.manage**. Valid only from `Scheduled`."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The updated pickup.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Pickup' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the pickups.manage permission." }
 *       404: { description: Pickup not found. }
 *       409: { description: The pickup is not in a state that can start. }
 */
pickupRouter.post('/:id/start', requirePermission('pickups.manage'), validateRequest({ params: mongoIdParamSchema }), startPickup)

/**
 * @openapi
 * /pickups/{id}/arrive:
 *   post:
 *     tags: [Pickups]
 *     summary: Mark a pickup as arrived at the pickup location
 *     security: [{ bearerAuth: [] }]
 *     description: "Operations-only — requires **pickups.manage**. Valid only from `En Route`."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The updated pickup.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Pickup' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the pickups.manage permission." }
 *       404: { description: Pickup not found. }
 *       409: { description: The pickup is not in a state that can be marked arrived. }
 */
pickupRouter.post('/:id/arrive', requirePermission('pickups.manage'), validateRequest({ params: mongoIdParamSchema }), arrivePickup)

/**
 * @openapi
 * /pickups/{id}/collect:
 *   post:
 *     tags: [Pickups]
 *     summary: Confirm produce collection
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Operations-only — requires **pickups.manage**. Valid only from `Arrived`. Records the actual
 *       collected quantity/weight, GPS metadata at the point of collection, and photos.
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
 *             required: [collectedQuantity, collectedWeightKg]
 *             properties:
 *               collectedQuantity: { type: number, example: 480 }
 *               collectedWeightKg: { type: number, example: 480 }
 *               collectionGpsCoordinates: { type: object, properties: { lat: { type: number }, lng: { type: number } } }
 *               collectionPhotos: { type: array, items: { type: string, format: uri } }
 *               collectionNotes: { type: string }
 *     responses:
 *       200:
 *         description: The updated pickup.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Pickup' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the pickups.manage permission." }
 *       404: { description: Pickup not found. }
 *       409: { description: The pickup is not in a state that can be collected. }
 *       422: { description: Request body failed validation. }
 */
pickupRouter.post(
  '/:id/collect',
  requirePermission('pickups.manage'),
  validateRequest({ params: mongoIdParamSchema, body: collectPickupSchema }),
  collectPickup,
)

/**
 * @openapi
 * /pickups/{id}/complete:
 *   post:
 *     tags: [Pickups]
 *     summary: Complete a pickup
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Operations-only — requires **pickups.manage**. Valid only from `Collected`. Also advances the
 *       linked Storage Request from `Pickup Scheduled` to `Completed`, and emits `pickup.completed` —
 *       the extension point a future Inventory module will consume to auto-create an inventory record.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The completed pickup.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Pickup' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the pickups.manage permission." }
 *       404: { description: Pickup not found. }
 *       409: { description: The pickup is not in a state that can be completed. }
 */
pickupRouter.post('/:id/complete', requirePermission('pickups.manage'), validateRequest({ params: mongoIdParamSchema }), completePickup)

/**
 * @openapi
 * /pickups/{id}/cancel:
 *   post:
 *     tags: [Pickups]
 *     summary: Cancel a pickup
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Operations-only — requires **pickups.manage**. Valid from any status before `Collected`. If the
 *       linked Storage Request had already advanced to `Pickup Scheduled`, it is reverted to `Approved`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [reason], properties: { reason: { type: string, example: "Vehicle breakdown" } } }
 *     responses:
 *       200:
 *         description: The cancelled pickup.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Pickup' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the pickups.manage permission." }
 *       404: { description: Pickup not found. }
 *       409: { description: The pickup is not in a state that can be cancelled. }
 *       422: { description: Request body failed validation. }
 */
pickupRouter.post(
  '/:id/cancel',
  requirePermission('pickups.manage'),
  validateRequest({ params: mongoIdParamSchema, body: cancelPickupSchema }),
  cancelPickup,
)

/**
 * @openapi
 * /pickups/{id}/route-notes:
 *   patch:
 *     tags: [Pickups]
 *     summary: Update a pickup's route notes
 *     security: [{ bearerAuth: [] }]
 *     description: "Operations-only — requires **pickups.manage**. Allowed regardless of status."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [routeNotes], properties: { routeNotes: { type: string } } }
 *     responses:
 *       200:
 *         description: The updated pickup.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Pickup' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the pickups.manage permission." }
 *       404: { description: Pickup not found. }
 *       422: { description: Request body failed validation. }
 */
pickupRouter.patch(
  '/:id/route-notes',
  requirePermission('pickups.manage'),
  validateRequest({ params: mongoIdParamSchema, body: updateRouteNotesSchema }),
  updatePickupRouteNotes,
)
