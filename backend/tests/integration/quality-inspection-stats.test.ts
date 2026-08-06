import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { createActiveUser, createQualityInspectionRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsOperations(permissionKeys: string[] = ['inspections.manage']) {
  await createActiveUser({ email: 'ops@keepxtra.com', permissionKeys })
  return loginAndGetToken('ops@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/quality-inspections/stats/summary', () => {
  it('aggregates status counts, grade breakdown, and acceptance rate', async () => {
    await createQualityInspectionRecord({ status: 'Pending' })
    await createQualityInspectionRecord({
      status: 'Approved',
      qualityGrade: 'A',
      inspectedQuantity: 100,
      acceptedQuantity: 100,
      rejectedQuantity: 0,
    })
    await createQualityInspectionRecord({
      status: 'Partially Accepted',
      qualityGrade: 'B',
      inspectedQuantity: 100,
      acceptedQuantity: 60,
      rejectedQuantity: 40,
    })
    await createQualityInspectionRecord({
      status: 'Rejected',
      qualityGrade: 'Rejected',
      inspectedQuantity: 50,
      acceptedQuantity: 0,
      rejectedQuantity: 50,
    })

    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/quality-inspections/stats/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalInspections).toBe(4)
    expect(res.body.data.pendingCount).toBe(1)
    expect(res.body.data.approvedCount).toBe(1)
    expect(res.body.data.partiallyAcceptedCount).toBe(1)
    expect(res.body.data.rejectedCount).toBe(1)
    expect(res.body.data.byGrade.A).toBe(1)
    expect(res.body.data.byGrade.B).toBe(1)
    expect(res.body.data.byGrade.Rejected).toBe(1)
    // accepted 100+60+0 = 160 of inspected 100+100+50 = 250 -> 64%
    expect(res.body.data.acceptanceRatePercent).toBe(64)
  })

  it('tolerates a decided record with no recorded quantities or grade (treats them as zero/absent)', async () => {
    await createQualityInspectionRecord({ status: 'Approved', qualityGrade: null, inspectedQuantity: null, acceptedQuantity: null })
    const token = await loginAsOperations()

    const res = await request(testApp).get('/api/v1/quality-inspections/stats/summary').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.totalInspections).toBe(1)
    expect(res.body.data.approvedCount).toBe(1)
    expect(res.body.data.acceptanceRatePercent).toBe(0)
  })

  it('returns zeroed stats when there are no inspections', async () => {
    const token = await loginAsOperations()
    const res = await request(testApp).get('/api/v1/quality-inspections/stats/summary').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalInspections).toBe(0)
    expect(res.body.data.acceptanceRatePercent).toBe(0)
  })

  it('rejects a caller without inspections.manage', async () => {
    const token = await loginAsOperations([])
    const res = await request(testApp).get('/api/v1/quality-inspections/stats/summary').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})
