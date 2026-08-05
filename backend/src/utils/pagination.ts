export interface PaginationInput {
  page?: number
  pageSize?: number
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginationParams {
  page: number
  pageSize: number
  skip: number
  limit: number
}

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 25
export const MAX_PAGE_SIZE = 200

/**
 * Normalizes raw (already-validated) pagination input into the numbers a
 * Mongoose query needs. Kept separate from the Zod schema in
 * `validators/common.validators.ts` so repositories never have to know
 * about request-parsing concerns.
 */
export function resolvePagination(input: PaginationInput): PaginationParams {
  const page = Math.max(DEFAULT_PAGE, input.page ?? DEFAULT_PAGE)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE))
  const skip = (page - 1) * pageSize

  return { page, pageSize, skip, limit: pageSize }
}

export function buildPaginationMeta(total: number, params: PaginationParams): PaginationMeta {
  return {
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / params.pageSize),
  }
}
