import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import {
  createFarmerSchema,
  farmerListQuerySchema,
  updateFarmerSchema,
  updateFarmerStatusSchema,
} from '../validators/farmer.validators'
import {
  deleteFarmer,
  getFarmerById,
  getMyFarmerProfile,
  listFarmers,
  registerFarmer,
  restoreFarmer,
  updateFarmer,
  updateFarmerStatus,
} from '../controllers/farmer.controller'

export const farmerRouter = Router()

farmerRouter.use(authenticate)

/**
 * @openapi
 * /farmers:
 *   post:
 *     tags: [Farmers]
 *     summary: Register a new farmer
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Operations-only. Creates both a linked User account (status `Pending Review`, no password set)
 *       and the Farmer profile, then emails a "set your password" link reusing the password-reset flow.
 *       Requires the **farmers.create** permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, phone, email, farmName, farmLocation, district, region, primaryCrops, preferredPaymentMethod]
 *             properties:
 *               firstName: { type: string, example: Kwame }
 *               lastName: { type: string, example: Asante }
 *               phone: { type: string, example: "+233 24 000 0000" }
 *               alternativePhone: { type: string }
 *               email: { type: string, example: kwame@keepxtra.com }
 *               nationalId: { type: string }
 *               farmName: { type: string, example: Asante Farms }
 *               farmLocation: { type: string, example: Nsawam Farm Gate }
 *               district: { type: string, example: Nsawam-Adoagyiri }
 *               region: { type: string, example: Eastern }
 *               gpsCoordinates: { type: object, properties: { lat: { type: number }, lng: { type: number } } }
 *               primaryCrops: { type: array, items: { type: string }, example: [Tomatoes, Maize] }
 *               preferredPickupDays: { type: array, items: { type: string }, example: [Monday, Thursday] }
 *               preferredPaymentMethod: { type: string, enum: [Mobile Money, Bank Transfer] }
 *               bankDetails: { type: object, properties: { bankName: { type: string }, accountNumber: { type: string }, accountName: { type: string } } }
 *               mobileMoneyDetails: { type: object, properties: { provider: { type: string }, phoneNumber: { type: string } } }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Farmer registered.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Farmer' } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the farmers.create permission." }
 *       409: { description: A farmer or user with this phone/email already exists. }
 *       422: { description: Request body failed validation. }
 */
farmerRouter.post('/', requirePermission('farmers.create'), validateRequest({ body: createFarmerSchema }), registerFarmer)

/**
 * @openapi
 * /farmers:
 *   get:
 *     tags: [Farmers]
 *     summary: List farmers
 *     security: [{ bearerAuth: [] }]
 *     description: Operations-only. Requires the **farmers.read** permission. Supports search, filtering, sorting, and pagination.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches farmer number, name, phone, email, farm name, district, or region.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Active, Inactive] }
 *       - in: query
 *         name: region
 *         schema: { type: string }
 *       - in: query
 *         name: district
 *         schema: { type: string }
 *       - in: query
 *         name: primaryCrop
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
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
 *         description: A page of farmers.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/FarmerListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the farmers.read permission." }
 */
farmerRouter.get('/', requirePermission('farmers.read'), validateRequest({ query: farmerListQuerySchema }), listFarmers)

/**
 * @openapi
 * /farmers/me:
 *   get:
 *     tags: [Farmers]
 *     summary: Get the current user's own farmer profile
 *     security: [{ bearerAuth: [] }]
 *     description: For a logged-in farmer to view their own profile — no special permission required.
 *     responses:
 *       200:
 *         description: The caller's farmer profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Farmer' } }
 *       401: { description: Not authenticated. }
 *       404: { description: No farmer profile is linked to this account. }
 */
farmerRouter.get('/me', getMyFarmerProfile)

/**
 * @openapi
 * /farmers/{id}:
 *   get:
 *     tags: [Farmers]
 *     summary: Get a farmer by id
 *     security: [{ bearerAuth: [] }]
 *     description: Allowed for Operations users with **farmers.read**, or for the farmer viewing their own record.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The farmer.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Farmer' } }
 *       401: { description: Not authenticated. }
 *       403: { description: Not permitted to view this farmer. }
 *       404: { description: Farmer not found. }
 */
farmerRouter.get('/:id', validateRequest({ params: mongoIdParamSchema }), getFarmerById)

/**
 * @openapi
 * /farmers/{id}:
 *   patch:
 *     tags: [Farmers]
 *     summary: Update a farmer's profile
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Allowed for Operations users with **farmers.update**, or for the farmer editing their own record
 *       (self-service updates cannot change the internal `notes` field). `farmerNumber`, `userId`, and
 *       `status` are never accepted here — status changes go through PATCH /farmers/{id}/status.
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
 *             description: Any subset of the farmer's editable fields.
 *     responses:
 *       200:
 *         description: The updated farmer.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Farmer' } }
 *       401: { description: Not authenticated. }
 *       403: { description: Not permitted to update this farmer. }
 *       404: { description: Farmer not found. }
 *       422: { description: Request body failed validation. }
 */
farmerRouter.patch('/:id', validateRequest({ params: mongoIdParamSchema, body: updateFarmerSchema }), updateFarmer)

/**
 * @openapi
 * /farmers/{id}:
 *   delete:
 *     tags: [Farmers]
 *     summary: Soft-delete a farmer
 *     security: [{ bearerAuth: [] }]
 *     description: "Operations-only. Requires the **farmers.delete** permission. The record is soft-deleted, not removed — see POST /farmers/{id}/restore."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Farmer soft-deleted. }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the farmers.delete permission." }
 *       404: { description: Farmer not found. }
 */
farmerRouter.delete('/:id', requirePermission('farmers.delete'), validateRequest({ params: mongoIdParamSchema }), deleteFarmer)

/**
 * @openapi
 * /farmers/{id}/restore:
 *   post:
 *     tags: [Farmers]
 *     summary: Restore a soft-deleted farmer
 *     security: [{ bearerAuth: [] }]
 *     description: "Operations-only. Requires the **farmers.delete** permission."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The restored farmer.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Farmer' } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the farmers.delete permission." }
 *       404: { description: No deleted farmer found with this id. }
 */
farmerRouter.post('/:id/restore', requirePermission('farmers.delete'), validateRequest({ params: mongoIdParamSchema }), restoreFarmer)

/**
 * @openapi
 * /farmers/{id}/status:
 *   patch:
 *     tags: [Farmers]
 *     summary: Activate or deactivate a farmer
 *     security: [{ bearerAuth: [] }]
 *     description: "Operations-only. Requires the **farmers.update** permission."
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Active, Inactive] }
 *     responses:
 *       200:
 *         description: The updated farmer.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Farmer' } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the farmers.update permission." }
 *       404: { description: Farmer not found. }
 *       422: { description: Request body failed validation. }
 */
farmerRouter.patch('/:id/status', requirePermission('farmers.update'), validateRequest({ params: mongoIdParamSchema, body: updateFarmerStatusSchema }), updateFarmerStatus)
