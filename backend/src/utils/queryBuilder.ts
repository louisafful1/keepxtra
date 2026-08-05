import type { QueryFilter, SortOrder } from 'mongoose'

export interface DateRangeInput {
  from?: string
  to?: string
}

export interface SearchInput {
  search?: string
}

export interface SortInput {
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

/**
 * Builds the shared query-shape every list endpoint in the SAD supports:
 * free-text search (across a caller-supplied set of fields), a date-range
 * filter on a caller-supplied field, and equality filters for anything
 * else the caller already validated and wants applied verbatim.
 *
 * Repositories/services own *which* fields are searchable/filterable for
 * their collection — this helper only knows how to assemble the resulting
 * Mongo filter object.
 */
export function buildFilterQuery<T>(options: {
  search?: SearchInput
  searchableFields?: (keyof T)[]
  dateRange?: DateRangeInput
  dateField?: keyof T
  equality?: Partial<Record<keyof T, unknown>>
}): QueryFilter<T> {
  const filter: QueryFilter<T> = {}
  const and: QueryFilter<T>[] = []

  const searchTerm = options.search?.search?.trim()
  if (searchTerm && options.searchableFields?.length) {
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'i')
    and.push({
      $or: options.searchableFields.map((field) => ({ [field]: regex })),
    })
  }

  if (options.dateField && options.dateRange && (options.dateRange.from || options.dateRange.to)) {
    const range: Record<string, Date> = {}
    if (options.dateRange.from) range.$gte = new Date(options.dateRange.from)
    if (options.dateRange.to) range.$lte = new Date(options.dateRange.to)
    and.push({ [options.dateField]: range })
  }

  if (options.equality) {
    for (const [key, value] of Object.entries(options.equality)) {
      if (value === undefined || value === null || value === '') continue
      and.push({ [key]: value })
    }
  }

  if (and.length > 0) filter.$and = and
  return filter
}

export function buildSort(input: SortInput, defaultSortBy = 'createdAt'): Record<string, SortOrder> {
  const field = input.sortBy?.trim() || defaultSortBy
  const direction: SortOrder = input.sortDir === 'asc' ? 1 : -1
  return { [field]: direction }
}
