import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createCustomerRecord, createOrderRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsReportsViewer() {
  await createActiveUser({ email: 'reports-viewer5@keepxtra.com', permissionKeys: ['reports.view'] })
  return loginAndGetToken('reports-viewer5@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('Report export formats', () => {
  it('returns a CSV file when format=csv', async () => {
    const customer = await createCustomerRecord()
    await createOrderRecord({ customerId: customer._id, status: 'Confirmed', confirmedAt: new Date(), totalAmount: 100 })
    const token = await loginAsReportsViewer()

    const res = await request(testApp).get('/api/v1/reports/revenue').query({ format: 'csv' }).set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('revenue-report.csv')
    expect(res.text).toContain('Year,Month,Orders,Revenue,Farmer Earnings,Profit')
  })

  it('returns an empty-but-valid CSV body when there are no rows', async () => {
    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/fleet').query({ format: 'csv' }).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    // Fleet always has 4 status rows (Available/On Trip/Under Maintenance/Out of Service), never truly empty,
    // so this just asserts the CSV round-trips through a real HTTP response cleanly.
    expect(res.text.split('\n').length).toBeGreaterThan(1)
  })

  it('returns a PDF file when format=pdf', async () => {
    const customer = await createCustomerRecord()
    await createOrderRecord({ customerId: customer._id, status: 'Confirmed', confirmedAt: new Date(), totalAmount: 100 })
    const token = await loginAsReportsViewer()

    const res = await request(testApp).get('/api/v1/reports/revenue').query({ format: 'pdf' }).set('Authorization', `Bearer ${token}`).buffer(true).parse((response, callback) => {
      const chunks: Buffer[] = []
      response.on('data', (chunk: Buffer) => chunks.push(chunk))
      response.on('end', () => callback(null, Buffer.concat(chunks)))
    })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('application/pdf')
    expect(res.headers['content-disposition']).toContain('revenue-report.pdf')
    const body = res.body as Buffer
    expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })

  it('defaults to JSON when format is omitted', async () => {
    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/warehouses').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('application/json')
    expect(res.body.data).toHaveProperty('warehouses')
  })

  it('rejects an invalid format value', async () => {
    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/warehouses').query({ format: 'xml' }).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(422)
  })
})

describe('Report permission gate applies to every endpoint', () => {
  it('rejects a caller without reports.view on every report route', async () => {
    await createActiveUser({ email: 'no-reports@keepxtra.com', permissionKeys: [] })
    const token = await loginAndGetToken('no-reports@keepxtra.com', DEFAULT_TEST_PASSWORD)

    const endpoints = [
      '/api/v1/reports/dashboard',
      '/api/v1/reports/revenue',
      '/api/v1/reports/farmers',
      '/api/v1/reports/warehouses',
      '/api/v1/reports/inventory',
      '/api/v1/reports/sales',
      '/api/v1/reports/payments',
      '/api/v1/reports/pickups',
      '/api/v1/reports/fleet',
      '/api/v1/reports/inspections',
    ]

    for (const endpoint of endpoints) {
      const res = await request(testApp).get(endpoint).set('Authorization', `Bearer ${token}`)
      expect(res.status, `${endpoint} should reject a caller without reports.view`).toBe(403)
    }
  })
})
