import { z } from 'zod'
import { dateRangeQuerySchema } from './common.validators'

export const reportFormatSchema = z.enum(['json', 'csv', 'pdf'])

export const reportQuerySchema = dateRangeQuerySchema.extend({
  format: reportFormatSchema.optional(),
})

export const farmerReportQuerySchema = reportQuerySchema.extend({
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type ReportFormat = z.infer<typeof reportFormatSchema>
export type ReportQuery = z.infer<typeof reportQuerySchema>
export type FarmerReportQuery = z.infer<typeof farmerReportQuerySchema>
