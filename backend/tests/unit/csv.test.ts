import { describe, expect, it } from 'vitest'
import { toCsv } from '../../src/utils/csv'

describe('toCsv', () => {
  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('')
  })

  it('renders headers from the first row and one line per record', () => {
    const csv = toCsv([
      { Name: 'Maize', Quantity: 100 },
      { Name: 'Tomato', Quantity: 50 },
    ])
    expect(csv).toBe('Name,Quantity\nMaize,100\nTomato,50')
  })

  it('renders null/undefined cells as empty strings', () => {
    const csv = toCsv([{ Name: 'Maize', Note: null }, { Name: 'Tomato', Note: undefined }])
    expect(csv).toBe('Name,Note\nMaize,\nTomato,')
  })

  it('quotes and escapes a field containing a comma', () => {
    expect(toCsv([{ Address: '12 Main St, Accra' }])).toBe('Address\n"12 Main St, Accra"')
  })

  it('quotes and doubles an embedded quote', () => {
    expect(toCsv([{ Note: 'She said "hello"' }])).toBe('Note\n"She said ""hello"""')
  })

  it('quotes a field containing a newline', () => {
    expect(toCsv([{ Note: 'Line one\nLine two' }])).toBe('Note\n"Line one\nLine two"')
  })
})
