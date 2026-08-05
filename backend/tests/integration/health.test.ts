import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'

describe('GET /health', () => {
  it('reports liveness without depending on the database', async () => {
    const res = await request(testApp).get('/health')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok' })
    expect(typeof res.body.uptimeSeconds).toBe('number')
  })
})

describe('GET /health/ready', () => {
  it('reports ready once the database is connected', async () => {
    const res = await request(testApp).get('/health/ready')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ready', dependencies: { database: 'connected' } })
  })
})

describe('unmatched routes', () => {
  it('returns a consistent 404 error envelope', async () => {
    const res = await request(testApp).get('/this-route-does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } })
    expect(res.body.error.requestId).toBeTruthy()
  })
})
