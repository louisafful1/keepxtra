import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { requirePermission } from '../middlewares/requirePermission'
import { validateRequest } from '../middlewares/validateRequest'
import { farmerReportQuerySchema, reportQuerySchema } from '../validators/report.validators'
import {
  getDashboardSummary,
  getFarmerReport,
  getFleetReport,
  getInspectionReport,
  getInventoryReport,
  getPaymentReport,
  getPickupReport,
  getRevenueReport,
  getSalesReport,
  getWarehouseReport,
} from '../controllers/report.controller'

export const reportRouter = Router()

reportRouter.use(authenticate)
reportRouter.use(requirePermission('reports.view'))

/**
 * @openapi
 * /reports/dashboard:
 *   get:
 *     tags: [Reports]
 *     summary: Cross-module KPI summary for the admin dashboard homepage
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **reports.view**."
 *     responses:
 *       200: { description: The dashboard summary. }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the reports.view permission." }
 */
reportRouter.get('/dashboard', getDashboardSummary)

/**
 * @openapi
 * /reports/revenue:
 *   get:
 *     tags: [Reports]
 *     summary: Monthly revenue trend (from confirmed/delivered orders)
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **reports.view**."
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *         description: JSON data (default), or a downloadable CSV/PDF export of the same report.
 *     responses:
 *       200: { description: The revenue report (or a CSV/PDF file when `format` is set). }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the reports.view permission." }
 */
reportRouter.get('/revenue', validateRequest({ query: reportQuerySchema }), getRevenueReport)

/**
 * @openapi
 * /reports/farmers:
 *   get:
 *     tags: [Reports]
 *     summary: Top farmers by paid earnings
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **reports.view**."
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *         description: JSON data (default), or a downloadable CSV/PDF export of the same report.
 *     responses:
 *       200: { description: The farmer performance report (or a CSV/PDF file when `format` is set). }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the reports.view permission." }
 */
reportRouter.get('/farmers', validateRequest({ query: farmerReportQuerySchema }), getFarmerReport)

/**
 * @openapi
 * /reports/warehouses:
 *   get:
 *     tags: [Reports]
 *     summary: Warehouse capacity utilization
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **reports.view**."
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *         description: JSON data (default), or a downloadable CSV/PDF export of the same report.
 *     responses:
 *       200: { description: The warehouse utilization report (or a CSV/PDF file when `format` is set). }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the reports.view permission." }
 */
reportRouter.get('/warehouses', validateRequest({ query: reportQuerySchema }), getWarehouseReport)

/**
 * @openapi
 * /reports/inventory:
 *   get:
 *     tags: [Reports]
 *     summary: In-stock inventory levels and value, by produce type and warehouse
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **reports.view**."
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *         description: JSON data (default), or a downloadable CSV/PDF export of the same report.
 *     responses:
 *       200: { description: The inventory report (or a CSV/PDF file when `format` is set). }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the reports.view permission." }
 */
reportRouter.get('/inventory', validateRequest({ query: reportQuerySchema }), getInventoryReport)

/**
 * @openapi
 * /reports/sales:
 *   get:
 *     tags: [Reports]
 *     summary: Orders broken down by status and by customer type
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **reports.view**."
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *         description: JSON data (default), or a downloadable CSV/PDF export of the same report.
 *     responses:
 *       200: { description: The sales report (or a CSV/PDF file when `format` is set). }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the reports.view permission." }
 */
reportRouter.get('/sales', validateRequest({ query: reportQuerySchema }), getSalesReport)

/**
 * @openapi
 * /reports/payments:
 *   get:
 *     tags: [Reports]
 *     summary: Farmer payouts broken down by status
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **reports.view**."
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *         description: JSON data (default), or a downloadable CSV/PDF export of the same report.
 *     responses:
 *       200: { description: The payment report (or a CSV/PDF file when `format` is set). }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the reports.view permission." }
 */
reportRouter.get('/payments', validateRequest({ query: reportQuerySchema }), getPaymentReport)

/**
 * @openapi
 * /reports/pickups:
 *   get:
 *     tags: [Reports]
 *     summary: Pickup status breakdown, completion rate, and average turnaround
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **reports.view**."
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *         description: JSON data (default), or a downloadable CSV/PDF export of the same report.
 *     responses:
 *       200: { description: The pickup report (or a CSV/PDF file when `format` is set). }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the reports.view permission." }
 */
reportRouter.get('/pickups', validateRequest({ query: reportQuerySchema }), getPickupReport)

/**
 * @openapi
 * /reports/fleet:
 *   get:
 *     tags: [Reports]
 *     summary: Vehicle status breakdown, driver availability, and maintenance/fuel costs
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **reports.view**."
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *         description: JSON data (default), or a downloadable CSV/PDF export of the same report.
 *     responses:
 *       200: { description: The fleet report (or a CSV/PDF file when `format` is set). }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the reports.view permission." }
 */
reportRouter.get('/fleet', validateRequest({ query: reportQuerySchema }), getFleetReport)

/**
 * @openapi
 * /reports/inspections:
 *   get:
 *     tags: [Reports]
 *     summary: Quality inspection breakdown by grade/status and platform-wide rejection rate
 *     security: [{ bearerAuth: [] }]
 *     description: "Requires **reports.view**."
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *         description: JSON data (default), or a downloadable CSV/PDF export of the same report.
 *     responses:
 *       200: { description: The inspection report (or a CSV/PDF file when `format` is set). }
 *       401: { description: Not authenticated. }
 *       403: { description: "Missing the reports.view permission." }
 */
reportRouter.get('/inspections', validateRequest({ query: reportQuerySchema }), getInspectionReport)
