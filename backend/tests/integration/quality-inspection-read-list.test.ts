import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createQualityInspectionRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['inspections.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/quality-inspections', () => {
  it('lists every inspection', async () => {
    await createQualityInspectionRecord()
    await createQualityInspectionRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/quality-inspections').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(2)
  })

  it('searches by inspection code', async () => {
    const { inspection } = await createQualityInspectionRecord({ inspectionCode: 'QI-77001' })
    await createQualityInspectionRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/quality-inspections').query({ search: 'QI-77001' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).toBe(inspection._id.toString())
  })

  it('filters by status', async () => {
    await createQualityInspectionRecord({ status: 'Pending' })
    await createQualityInspectionRecord({ status: 'Approved' })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/quality-inspections').query({ status: 'Approved' }).set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
  })

  it('filters by inventoryId', async () => {
    const { inspection, inventory } = await createQualityInspectionRecord()
    await createQualityInspectionRecord()
    const token = await loginAsOperations()

    const res = await request(testApp)
      .get('/api/v1/quality-inspections')
      .query({ inventoryId: inventory._id.toString() })
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data[0].id).toBe(inspection._id.toString())
  })

  it('paginates results', async () => {
    await createQualityInspectionRecord()
    await createQualityInspectionRecord()
    await createQualityInspectionRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/quality-inspections').query({ page: 1, pageSize: 2 }).set('Authorization', `Bearer ${token}`)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.totalPages).toBe(2)
  })

  it('rejects a caller without inspections.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/quality-inspections').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(testApp).get('/api/v1/quality-inspections')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/quality-inspections/:id', () => {
  it('returns the inspection', async () => {
    const { inspection } = await createQualityInspectionRecord()
    const token = await loginAsOperations()

    const res = await request(testApp).get(`/api/v1/quality-inspections/${inspection._id.toString()}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(inspection._id.toString())
  })

  it('returns 404 for an unknown id', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/quality-inspections/665f1a2b3c4d5e6f7a8b9c0d').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
