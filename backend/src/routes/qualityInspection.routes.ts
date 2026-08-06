import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { mongoIdParamSchema } from '../validators/common.validators'
import { assignInspectorSchema, qualityInspectionListQuerySchema, submitInspectionSchema } from '../validators/qualityInspection.validators'
import {
  assignInspector,
  getQualityInspectionById,
  getQualityInspectionStatsSummary,
  listQualityInspections,
  submitInspection,
} from '../controllers/qualityInspection.controller'

export const qualityInspectionRouter = Router()

qualityInspectionRouter.use(authenticate)
qualityInspectionRouter.use(requirePermission('inspections.manage'))

/**
 * @openapi
 * /quality-inspections:
 *   get:
 *     tags: [Quality Inspections]
 *     summary: List quality inspections
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **inspections.manage**. Supports search, filtering, sorting, and pagination."
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches inspection code, inventory code, produce type, or warehouse code.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pending, In Progress, Approved, Partially Accepted, Rejected] }
 *       - in: query
 *         name: qualityGrade
 *         schema: { type: string, enum: [A, B, C, Rejected] }
 *       - in: query
 *         name: warehouseId
 *         schema: { type: string }
 *       - in: query
 *         name: inventoryId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200:
 *         description: A page of quality inspections.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/QualityInspectionListResponse' }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inspections.manage permission." }
 */
qualityInspectionRouter.get('/', validateRequest({ query: qualityInspectionListQuerySchema }), listQualityInspections)

/**
 * @openapi
 * /quality-inspections/stats/summary:
 *   get:
 *     tags: [Quality Inspections]
 *     summary: Aggregate inspection outcome statistics
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **inspections.manage**."
 *     responses:
 *       200:
 *         description: The aggregate statistics.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/QualityInspectionStatsSummary' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inspections.manage permission." }
 */
qualityInspectionRouter.get('/stats/summary', getQualityInspectionStatsSummary)

/**
 * @openapi
 * /quality-inspections/{id}:
 *   get:
 *     tags: [Quality Inspections]
 *     summary: Get a quality inspection by id
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **inspections.manage**."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The quality inspection.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/QualityInspection' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inspections.manage permission." }
 *       404: { description: Quality inspection not found. }
 */
qualityInspectionRouter.get('/:id', validateRequest({ params: mongoIdParamSchema }), getQualityInspectionById)

/**
 * @openapi
 * /quality-inspections/{id}/assign:
 *   patch:
 *     tags: [Quality Inspections]
 *     summary: Assign an inspector
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **inspections.manage**. Valid only from `Pending`. Optional — `submit` can also be called directly from `Pending`."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [inspectorId], properties: { inspectorId: { type: string } } }
 *     responses:
 *       200:
 *         description: The updated inspection.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/QualityInspection' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inspections.manage permission." }
 *       404: { description: Quality inspection or inspector not found. }
 *       409: { description: The inspection is not in a state that can be assigned. }
 *       422: { description: Request body failed validation. }
 */
qualityInspectionRouter.patch('/:id/assign', validateRequest({ params: mongoIdParamSchema, body: assignInspectorSchema }), assignInspector)

/**
 * @openapi
 * /quality-inspections/{id}/submit:
 *   patch:
 *     tags: [Quality Inspections]
 *     summary: Submit inspection findings and decide the outcome
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Requires **inspections.manage**. Valid from `Pending` or `In Progress`. The outcome is derived
 *       from `acceptedQuantity` vs `inspectedQuantity`: equal → `Approved`, zero → `Rejected`, otherwise
 *       → `Partially Accepted`. Any rejected portion is deducted from the linked Inventory record via
 *       an `Adjustment` movement.
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
 *             required: [qualityGrade, inspectedQuantity, acceptedQuantity]
 *             properties:
 *               qualityGrade: { type: string, enum: [A, B, C, Rejected] }
 *               inspectedQuantity: { type: number, example: 480 }
 *               acceptedQuantity: { type: number, example: 450 }
 *               photos: { type: array, items: { type: string, format: uri } }
 *               defects: { type: array, items: { type: string }, example: ["Minor bruising"] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: The completed inspection.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { success: { type: boolean, example: true }, data: { $ref: '#/components/schemas/QualityInspection' } } }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the inspections.manage permission." }
 *       404: { description: Quality inspection not found. }
 *       409: { description: The inspection is not in a state that can be submitted. }
 *       422: { description: Request body failed validation. }
 */
qualityInspectionRouter.patch('/:id/submit', validateRequest({ params: mongoIdParamSchema, body: submitInspectionSchema }), submitInspection)
