import PDFDocument from 'pdfkit'
import type { CsvCellValue } from './csv'

const COLUMN_MIN_WIDTH = 90
const ROW_HEIGHT = 20
const PAGE_MARGIN = 40

/**
 * Renders a flat-row report as a simple tabular PDF (title, generated-at
 * timestamp, header row, data rows with pagination) and resolves to the
 * finished buffer. Hand-rolled column layout — pdfkit has no built-in table
 * support, and a full-blown table library is overkill for what these
 * reports need.
 */
export function buildPdfReport(title: string, rows: Record<string, CsvCellValue>[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', layout: 'landscape' })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(16).text(title, { align: 'left' })
    doc.fontSize(9).fillColor('#555555').text(`Generated ${new Date().toISOString()}`, { align: 'left' })
    doc.moveDown()
    doc.fillColor('#000000')

    if (rows.length === 0) {
      doc.fontSize(11).text('No data available for this report.')
      doc.end()
      return
    }

    const headers = Object.keys(rows[0]!)
    const pageWidth = doc.page.width - PAGE_MARGIN * 2
    const columnWidth = Math.max(COLUMN_MIN_WIDTH, pageWidth / headers.length)

    function drawHeaderRow(y: number): void {
      doc.fontSize(9).font('Helvetica-Bold')
      headers.forEach((header, i) => {
        doc.text(header, PAGE_MARGIN + i * columnWidth, y, { width: columnWidth, ellipsis: true })
      })
      doc.font('Helvetica')
    }

    let y = doc.y
    drawHeaderRow(y)
    y += ROW_HEIGHT

    for (const row of rows) {
      if (y + ROW_HEIGHT > doc.page.height - PAGE_MARGIN) {
        doc.addPage()
        y = PAGE_MARGIN
        drawHeaderRow(y)
        y += ROW_HEIGHT
      }

      doc.fontSize(9)
      headers.forEach((header, i) => {
        const value = row[header]
        doc.text(value === null || value === undefined ? '' : String(value), PAGE_MARGIN + i * columnWidth, y, {
          width: columnWidth,
          ellipsis: true,
        })
      })
      y += ROW_HEIGHT
    }

    doc.end()
  })
}
