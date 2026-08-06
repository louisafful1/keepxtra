import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { toCsv } from '../utils/csv'
import { buildPdfReport } from '../utils/pdf'
import { reportService, type ReportResult } from '../services/report.service'
import type { ReportQuery } from '../validators/report.validators'

/** Every report endpoint shares this response shape: JSON by default, or a downloadable CSV/PDF of the same report's tabular rows. */
async function respond<T>(req: Request, res: Response, title: string, filenameBase: string, result: ReportResult<T>): Promise<void> {
  const format = (req.query as ReportQuery).format ?? 'json'

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`)
    res.status(200).send(toCsv(result.rows))
    return
  }

  if (format === 'pdf') {
    const buffer = await buildPdfReport(title, result.rows)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`)
    res.status(200).send(buffer)
    return
  }

  ApiResponse.ok(res, result.dto)
}

export const getDashboardSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await reportService.getDashboardSummary()
  ApiResponse.ok(res, summary)
})

export const getRevenueReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getRevenueReport(req.query)
  await respond(req, res, 'Revenue Report', 'revenue-report', result)
})

export const getFarmerReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getFarmerReport(req.query)
  await respond(req, res, 'Farmer Performance Report', 'farmer-report', result)
})

export const getWarehouseReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getWarehouseReport()
  await respond(req, res, 'Warehouse Utilization Report', 'warehouse-report', result)
})

export const getInventoryReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getInventoryReport()
  await respond(req, res, 'Inventory Report', 'inventory-report', result)
})

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getSalesReport(req.query)
  await respond(req, res, 'Sales Report', 'sales-report', result)
})

export const getPaymentReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getPaymentReport()
  await respond(req, res, 'Payment Report', 'payment-report', result)
})

export const getPickupReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getPickupReport()
  await respond(req, res, 'Pickup Report', 'pickup-report', result)
})

export const getFleetReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getFleetReport()
  await respond(req, res, 'Fleet Report', 'fleet-report', result)
})

export const getInspectionReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getInspectionReport()
  await respond(req, res, 'Quality Inspection Report', 'inspection-report', result)
})
