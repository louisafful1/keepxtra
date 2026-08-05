import { z } from 'zod'
import { MAX_PAGE_SIZE } from '../utils/pagination'

/**
 * The list-endpoint query vocabulary shared across every future module
 * (search/sort/pagination/date-range), matching the frontend's existing
 * `TableToolbar` filter conventions documented in the SAD (§6). Modules
 * extend this with their own `.extend({...})` for resource-specific
 * filters (status enums, etc.) rather than redefining pagination each time.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).optional(),
})

export const sortQuerySchema = z.object({
  sortBy: z.string().min(1).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
})

export const searchQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
})

export const dateRangeQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  to: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
})

export const listQuerySchema = paginationQuerySchema.merge(sortQuerySchema).merge(searchQuerySchema).merge(dateRangeQuerySchema)

export const mongoIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format'),
})
