export type CsvCellValue = string | number | boolean | null | undefined

/** Escapes a single CSV field per RFC 4180 — wraps in quotes and doubles any embedded quote whenever the value contains a comma, quote, or newline. */
function escapeCsvField(value: CsvCellValue): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

/** Serializes an array of flat records into a CSV string, using the first row's keys as the header. Returns just a header-less empty string for an empty array. */
export function toCsv(rows: Record<string, CsvCellValue>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0]!)
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvField(row[header])).join(','))
  }
  return lines.join('\n')
}
