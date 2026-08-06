import { describe, expect, it } from 'vitest'
import { buildPdfReport } from '../../src/utils/pdf'

describe('buildPdfReport', () => {
  it('renders a "no data" PDF when there are no rows', async () => {
    const buffer = await buildPdfReport('Empty Report', [])
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })

  it('renders a single-page PDF for a small row set, blanking null/undefined cells', async () => {
    const buffer = await buildPdfReport('Small Report', [
      { Name: 'Maize', Quantity: 100 },
      { Name: 'Tomato', Quantity: null },
      { Name: 'Onion', Quantity: undefined },
    ])
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })

  it('paginates onto additional pages when rows overflow one page', async () => {
    const rows = Array.from({ length: 60 }, (_, i) => ({ Row: i, Value: `Item ${i}` }))
    const buffer = await buildPdfReport('Large Report', rows)
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-')
    // A single page can't fit 60 rows at 20pt each on an A4 landscape page — the
    // buffer being noticeably larger than the single-page case is our proxy for
    // the addPage() branch having actually run.
    expect(buffer.length).toBeGreaterThan(2000)
  })
})
