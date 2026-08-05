import { describe, expect, it } from 'vitest'
import { buildFilterQuery, buildSort } from '../../src/utils/queryBuilder'

interface Sample {
  crop: string
  farmerName: string
  status: string
  storageDate: string
}

describe('buildFilterQuery', () => {
  it('returns an empty filter when nothing is provided', () => {
    expect(buildFilterQuery<Sample>({})).toEqual({})
  })

  it('builds a case-insensitive $or search across the given fields', () => {
    const filter = buildFilterQuery<Sample>({
      search: { search: 'tomato' },
      searchableFields: ['crop', 'farmerName'],
    })

    expect(filter.$and).toHaveLength(1)
    const orClause = filter.$and?.[0] as unknown as { $or: Record<string, RegExp>[] }
    const cropRegex = orClause.$or[0]?.crop
    expect(cropRegex).toBeInstanceOf(RegExp)
    expect(cropRegex?.test('Tomatoes')).toBe(true)
  })

  it('builds a date range clause on the given field', () => {
    const filter = buildFilterQuery<Sample>({
      dateField: 'storageDate',
      dateRange: { from: '2026-01-01', to: '2026-01-31' },
    })

    const clause = filter.$and?.[0] as unknown as { storageDate: { $gte: Date; $lte: Date } }
    expect(clause.storageDate.$gte).toBeInstanceOf(Date)
    expect(clause.storageDate.$lte).toBeInstanceOf(Date)
  })

  it('skips empty/undefined equality filters', () => {
    const filter = buildFilterQuery<Sample>({ equality: { status: '', crop: undefined } })
    expect(filter.$and).toBeUndefined()
  })
})

describe('buildSort', () => {
  it('defaults to createdAt descending', () => {
    expect(buildSort({})).toEqual({ createdAt: -1 })
  })

  it('honors sortBy and sortDir', () => {
    expect(buildSort({ sortBy: 'name', sortDir: 'asc' })).toEqual({ name: 1 })
  })
})
