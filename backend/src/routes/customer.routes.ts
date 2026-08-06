import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import { createCustomerSchema, customerListQuerySchema, updateCustomerSchema, updateCustomerStatusSchema } from '../validators/customer.validators'
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  restoreCustomer,
  updateCustomer,
  updateCustomerStatus,
} from '../controllers/customer.controller'

export const customerRouter = Router()

customerRouter.use(authenticate)
customerRouter.use(requirePermission('sales.create'))

/**
 * @openapi
 * /customers:
 *   post:
 *     tags: [Sales]
 *     summary: Register a customer
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **sales.create**."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, phone, address]
 *             properties:
 *               name: { type: string, example: "Golden Spoon Restaurant" }
 *               type: { type: string, enum: [Restaurant, Hotel, Retailer, Wholesaler, Other] }
 *               contactPerson: { type: string }
 *               phone: { type: string, example: "+233 24 555 5555" }
 *               email: { type: string }
 *               address: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Customer created.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Customer' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       422: { description: Request body failed validation. }
 */
customerRouter.post('/', validateRequest({ body: createCustomerSchema }), createCustomer)

/**
 * @openapi
 * /customers:
 *   get:
 *     tags: [Sales]
 *     summary: List customers
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **sales.create**. Supports search, filtering, sorting, and pagination."
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Active, Inactive] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [Restaurant, Hotel, Retailer, Wholesaler, Other] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200:
 *         description: A page of customers.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CustomerListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 */
customerRouter.get('/', validateRequest({ query: customerListQuerySchema }), listCustomers)

/**
 * @openapi
 * /customers/{id}:
 *   get:
 *     tags: [Sales]
 *     summary: Get a customer by id
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **sales.create**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The customer.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Customer' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       404: { description: Customer not found. }
 */
customerRouter.get('/:id', validateRequest({ params: mongoIdParamSchema }), getCustomerById)

/**
 * @openapi
 * /customers/{id}:
 *   patch:
 *     tags: [Sales]
 *     summary: Update a customer
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **sales.create**. `customerCode` and `status` are never accepted here — status changes go through PATCH /customers/{id}/status."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, description: Any subset of the customer's editable fields. }
 *     responses:
 *       200:
 *         description: The updated customer.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Customer' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       404: { description: Customer not found. }
 *       422: { description: Request body failed validation. }
 */
customerRouter.patch('/:id', validateRequest({ params: mongoIdParamSchema, body: updateCustomerSchema }), updateCustomer)

/**
 * @openapi
 * /customers/{id}/status:
 *   patch:
 *     tags: [Sales]
 *     summary: Change a customer's status
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **sales.create**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [status], properties: { status: { type: string, enum: [Active, Inactive] } } }
 *     responses:
 *       200:
 *         description: The updated customer.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Customer' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       404: { description: Customer not found. }
 *       422: { description: Request body failed validation. }
 */
customerRouter.patch('/:id/status', validateRequest({ params: mongoIdParamSchema, body: updateCustomerStatusSchema }), updateCustomerStatus)

/**
 * @openapi
 * /customers/{id}:
 *   delete:
 *     tags: [Sales]
 *     summary: Soft-delete a customer
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **sales.create**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Customer soft-deleted. }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       404: { description: Customer not found. }
 */
customerRouter.delete('/:id', validateRequest({ params: mongoIdParamSchema }), deleteCustomer)

/**
 * @openapi
 * /customers/{id}/restore:
 *   post:
 *     tags: [Sales]
 *     summary: Restore a soft-deleted customer
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **sales.create**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The restored customer.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/Customer' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the sales.create permission." }
 *       404: { description: No deleted customer found with this id. }
 */
customerRouter.post('/:id/restore', validateRequest({ params: mongoIdParamSchema }), restoreCustomer)
