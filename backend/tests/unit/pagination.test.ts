import { describe, expect, it } from 'vitest'
import { buildPaginationMeta, resolvePagination } from '../../src/utils/pagination'

describe('resolvePagination', () => {
  it('applies defaults when nothing is provided', () => {
    expect(resolvePagination({})).toEqual({ page: 1, pageSize: 25, skip: 0, limit: 25 })
  })

  it('computes skip from page and pageSize', () => {
    expect(resolvePagination({ page: 3, pageSize: 10 })).toEqual({ page: 3, pageSize: 10, skip: 20, limit: 10 })
  })

  it('clamps pageSize to the maximum', () => {
    expect(resolvePagination({ pageSize: 10000 }).pageSize).toBe(200)
  })

  it('never allows page below 1', () => {
    expect(resolvePagination({ page: -5 }).page).toBe(1)
  })
})

describe('buildPaginationMeta', () => {
  it('computes totalPages, rounding up', () => {
    const meta = buildPaginationMeta(105, { page: 1, pageSize: 25, skip: 0, limit: 25 })
    expect(meta).toEqual({ page: 1, pageSize: 25, total: 105, totalPages: 5 })
  })

  it('returns 0 total pages when there are no results', () => {
    const meta = buildPaginationMeta(0, { page: 1, pageSize: 25, skip: 0, limit: 25 })
    expect(meta.totalPages).toBe(0)
  })
})
