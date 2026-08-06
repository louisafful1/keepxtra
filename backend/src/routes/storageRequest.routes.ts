import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import {
  cancelStorageRequestSchema,
  createStorageRequestSchema,
  rejectStorageRequestSchema,
  storageRequestListQuerySchema,
  updateInternalNotesSchema,
  updatePrioritySchema,
  updateStorageRequestSchema,
} from '../validators/storageRequest.validators'
import {
  approveStorageRequest,
  cancelStorageRequest,
  createStorageRequest,
  getStorageRequestById,
  listStorageRequests,
  rejectStorageRequest,
  submitStorageRequest,
  updateStorageRequest,
  updateStorageRequestInternalNotes,
  updateStorageRequestPriority,
} from '../controllers/storageRequest.controller'

export const storageRequestRouter = Router()

storageRequestRouter.use(authenticate)

/**
 * @openapi
 * /storage-requests:
 *   post:
 *     tags: [Storage Requests]
 *     summary: Create a storage request (Draft)
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Farmer-only — the caller must have a linked Farmer profile; the request is created for
 *       *their own* farmer record, in `Draft` status. Use POST /storage-requests/{id}/submit to move
 *       it into the review queue. A farmer cannot have more than one active (non-terminal) request for
 *       the same produce type + harvest date.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [produceType, quantity, unit, estimatedWeightKg, harvestDate, pickupLocation, preferredPickupDate, preferredPickupTime]
 *             properties:
 *               produceType: { type: string, example: Tomatoes }
 *               quantity: { type: number, example: 500 }
 *               unit: { type: string, enum: [kg, tons, bags, crates] }
 *               estimatedWeightKg: { type: number, example: 500 }
 *               harvestDate: { type: string, format: date, description: "Cannot be in the future" }
 *               pickupLocation: { type: string, example: Nsawam Farm Gate }
 *               gpsCoordinates: { type: object, properties: { lat: { type: number }, lng: { type: number } } }
 *               preferredPickupDate: { type: string, format: date, description: "Cannot be before harvestDate" }
 *               preferredPickupTime: { type: string, example: "08:00" }
 *               specialInstructions: { type: string }
 *               photos: { type: array, items: { type: string, format: uri } }
 *     responses:
 *       201:
 *         description: Storage request created.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/StorageRequest' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: The caller has no linked farmer profile. }
 *       409: { description: An active request for this produce + harvest date already exists. }
 *       422: { description: Request body failed validation. }
 */
storageRequestRouter.post('/', validateRequest({ body: createStorageRequestSchema }), createStorageRequest)

/**
 * @openapi
 * /storage-requests:
 *   get:
 *     tags: [Storage Requests]
 *     summary: List storage requests
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Operations users with **storage-requests.read** see every request and may filter/search freely.
 *       Farmers (no such permission) are automatically scoped to their own requests only.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches request number, farmer name, farmer number, produce type, district, or region.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Draft, Submitted, Under Review, Approved, Pickup Scheduled, Completed, Rejected, Cancelled] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [Low, Normal, High, Urgent] }
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
 *         name: harvestDateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: harvestDateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: pickupDateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: pickupDateTo
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
 *         description: A page of storage requests.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/StorageRequestListResponse' }
 *       401: { description: Not authenticated. }
 */
storageRequestRouter.get('/', validateRequest({ query: storageRequestListQuerySchema }), listStorageRequests)

/**
 * @openapi
 * /storage-requests/{id}:
 *   get:
 *     tags: [Storage Requests]
 *     summary: Get a storage request by id
 *     security: [{ bearerAuth: [] }]
 *     description: Allowed for Operations users with **storage-requests.read**, or the farmer who owns the request.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The storage request.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/StorageRequest' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: Not permitted to view this request. }
 *       404: { description: Storage request not found. }
 */
storageRequestRouter.get('/:id', validateRequest({ params: mongoIdParamSchema }), getStorageRequestById)

/**
 * @openapi
 * /storage-requests/{id}:
 *   patch:
 *     tags: [Storage Requests]
 *     summary: Update a storage request's content
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Operations-only — requires **storage-requests.update**. Only allowed while the request is
 *       `Draft`, `Submitted`, or `Under Review`; once `Approved` (or beyond) the record is read-only
 *       except via PATCH /storage-requests/{id}/internal-notes. `requestNumber`, `farmerId`, and
 *       `status` are never accepted here.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, description: Any subset of the request's editable fields. }
 *     responses:
 *       200:
 *         description: The updated storage request.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/StorageRequest' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the storage-requests.update permission." }
 *       404: { description: Storage request not found. }
 *       409: { description: The request is no longer editable in its current status. }
 *       422: { description: Request body failed validation. }
 */
storageRequestRouter.patch(
  '/:id',
  requirePermission('storage-requests.update'),
  validateRequest({ params: mongoIdParamSchema, body: updateStorageRequestSchema }),
  updateStorageRequest,
)

/**
 * @openapi
 * /storage-requests/{id}/submit:
 *   post:
 *     tags: [Storage Requests]
 *     summary: Submit a draft storage request for review
 *     security: [{ bearerAuth: [] }]
 *     description: Farmer-only, own request. Valid only from `Draft`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The submitted request.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/StorageRequest' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: Not the owner of this request. }
 *       404: { description: Storage request not found. }
 *       409: { description: The request is not in a state that can be submitted. }
 */
storageRequestRouter.post('/:id/submit', validateRequest({ params: mongoIdParamSchema }), submitStorageRequest)

/**
 * @openapi
 * /storage-requests/{id}/approve:
 *   post:
 *     tags: [Storage Requests]
 *     summary: Approve a submitted storage request
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Operations-only — requires **storage-requests.review**. Valid from `Submitted` or
 *       `Under Review`. Emits `storageRequest.approved` on the internal event bus — the extension
 *       point the future Pickup module will consume to create its own PickupRequest — and a
 *       "Storage Request Approved" notification event.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The approved request.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/StorageRequest' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the storage-requests.review permission." }
 *       404: { description: Storage request not found. }
 *       409: { description: The request is not in a state that can be approved. }
 */
storageRequestRouter.post(
  '/:id/approve',
  requirePermission('storage-requests.review'),
  validateRequest({ params: mongoIdParamSchema }),
  approveStorageRequest,
)

/**
 * @openapi
 * /storage-requests/{id}/reject:
 *   post:
 *     tags: [Storage Requests]
 *     summary: Reject a submitted storage request
 *     security: [{ bearerAuth: [] }]
 *     description: "Operations-only — requires **storage-requests.review**. Valid from `Submitted` or `Under Review`. A rejected request can never proceed to Pickup."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [reason], properties: { reason: { type: string, example: "Produce quality below grade" } } }
 *     responses:
 *       200:
 *         description: The rejected request.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/StorageRequest' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the storage-requests.review permission." }
 *       404: { description: Storage request not found. }
 *       409: { description: The request is not in a state that can be rejected. }
 *       422: { description: Request body failed validation. }
 */
storageRequestRouter.post(
  '/:id/reject',
  requirePermission('storage-requests.review'),
  validateRequest({ params: mongoIdParamSchema, body: rejectStorageRequestSchema }),
  rejectStorageRequest,
)

/**
 * @openapi
 * /storage-requests/{id}/cancel:
 *   post:
 *     tags: [Storage Requests]
 *     summary: Cancel a storage request
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Farmer-only, own request. Valid from `Draft`, `Submitted`, or `Under Review` — once
 *       `Approved`, a request can no longer be cancelled. A cancelled request can never be reactivated.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { reason: { type: string } } }
 *     responses:
 *       200:
 *         description: The cancelled request.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/StorageRequest' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: Not the owner of this request. }
 *       404: { description: Storage request not found. }
 *       409: { description: The request is not in a state that can be cancelled. }
 */
storageRequestRouter.post(
  '/:id/cancel',
  validateRequest({ params: mongoIdParamSchema, body: cancelStorageRequestSchema }),
  cancelStorageRequest,
)

/**
 * @openapi
 * /storage-requests/{id}/priority:
 *   patch:
 *     tags: [Storage Requests]
 *     summary: Change a storage request's priority
 *     security: [{ bearerAuth: [] }]
 *     description: "Operations-only — requires **storage-requests.update**. Only allowed while the request is Draft, Submitted, or Under Review."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [priority], properties: { priority: { type: string, enum: [Low, Normal, High, Urgent] } } }
 *     responses:
 *       200:
 *         description: The updated request.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/StorageRequest' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the storage-requests.update permission." }
 *       404: { description: Storage request not found. }
 *       409: { description: The request is no longer editable in its current status. }
 *       422: { description: Request body failed validation. }
 */
storageRequestRouter.patch(
  '/:id/priority',
  requirePermission('storage-requests.update'),
  validateRequest({ params: mongoIdParamSchema, body: updatePrioritySchema }),
  updateStorageRequestPriority,
)

/**
 * @openapi
 * /storage-requests/{id}/internal-notes:
 *   patch:
 *     tags: [Storage Requests]
 *     summary: Update a storage request's internal (Operations-only) notes
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Operations-only — requires **storage-requests.update**. The one field that stays editable
 *       regardless of status, including after Approval.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [internalNotes], properties: { internalNotes: { type: string } } }
 *     responses:
 *       200:
 *         description: The updated request.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/StorageRequest' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the storage-requests.update permission." }
 *       404: { description: Storage request not found. }
 *       422: { description: Request body failed validation. }
 */
storageRequestRouter.patch(
  '/:id/internal-notes',
  requirePermission('storage-requests.update'),
  validateRequest({ params: mongoIdParamSchema, body: updateInternalNotesSchema }),
  updateStorageRequestInternalNotes,
)
