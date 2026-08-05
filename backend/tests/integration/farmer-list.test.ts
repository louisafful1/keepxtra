import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createFarmerRecord } from '../utils/factories'

async function loginAsOperations(permissionKeys = ['farmers.read']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', 'Password123')
}

describe('GET /api/v1/farmers', () => {
  it('paginates results', async () => {
    for (let i = 0; i < 5; i += 1) {
      await createFarmerRecord({ firstName: `Farmer${i}` })
    }
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/farmers?pageSize=2&page=2').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta).toMatchObject({ page: 2, pageSize: 2, total: 5, totalPages: 3 })
  })

  it('searches by farmer number, name, phone, email, farm name, district, and region', async () => {
    const { farmer } = await createFarmerRecord({
      firstName: 'Yaw',
      lastName: 'Mensah',
      phone: '+233 20 999 8888',
      email: 'yaw.mensah@keepxtra.com',
      farmName: 'Mensah Groves',
      district: 'Sunyani West',
      region: 'Ahafo',
    })
    await createFarmerRecord({ firstName: 'Someone', lastName: 'Else' })
    const token = await loginAsOperations()

    const cases: [string, string][] = [
      ['search', farmer.farmerNumber],
      ['search', 'Yaw'],
      ['search', 'Mensah'],
      ['search', '999 8888'],
      ['search', 'yaw.mensah'],
      ['search', 'Groves'],
      ['search', 'Sunyani West'],
      ['search', 'Ahafo'],
    ]

    for (const [param, value] of cases) {
      const res = await request(testApp)
        .get(`/api/v1/farmers?${param}=${encodeURIComponent(value)}`)
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      const ids = (res.body.data as { id: string }[]).map((f) => f.id)
      expect(ids).toContain(farmer._id.toString())
      expect(res.body.data).toHaveLength(1)
    }
  })

  it('filters by status', async () => {
    await createFarmerRecord({ status: 'Active' })
    await createFarmerRecord({ status: 'Inactive' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/farmers?status=Inactive').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].status).toBe('Inactive')
  })

  it('filters by region and district', async () => {
    await createFarmerRecord({ region: 'Ashanti', district: 'Kumasi Metro' })
    await createFarmerRecord({ region: 'Volta', district: 'Ho Municipal' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/farmers?region=Ashanti&district=Kumasi Metro').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].region).toBe('Ashanti')
  })

  it('filters by primary crop', async () => {
    await createFarmerRecord({ primaryCrops: ['Cocoa', 'Plantain'] })
    await createFarmerRecord({ primaryCrops: ['Maize'] })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/farmers?primaryCrop=Cocoa').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].primaryCrops).toContain('Cocoa')
  })

  it('filters by createdAt date range', async () => {
    await createFarmerRecord()
    const token = await loginAsOperations()

    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const res = await request(testApp).get(`/api/v1/farmers?from=${future}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(0)
  })

  it('excludes soft-deleted farmers', async () => {
    const { farmer } = await createFarmerRecord()
    const token = await loginAsOperations(['farmers.read', 'farmers.delete'])
    await request(testApp).delete(`/api/v1/farmers/${farmer._id.toString()}`).set('Authorization', `Bearer ${token}`)

    const res = await request(testApp).get('/api/v1/farmers').set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(0)
  })

  it('rejects the request without the farmers.read permission', async () => {
    const token = await loginAsOperations(['farmers.create'])
    const res = await request(testApp).get('/api/v1/farmers').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/farmers')
    expect(res.status).toBe(401)
  })
})
