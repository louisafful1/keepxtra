import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { testApp } from '../utils/testApp'
import { loginAndGetToken } from '../utils/authHelpers'
import { Pickup } from '../../src/models/pickup.model'
import { createActiveUser, createPayoutRecord, createPickupRecord, createQualityInspectionRecord, DEFAULT_TEST_PASSWORD } from '../utils/factories'

async function loginAsReportsViewer() {
  await createActiveUser({ email: 'reports-viewer3@keepxtra.com', permissionKeys: ['reports.view'] })
  return loginAndGetToken('reports-viewer3@keepxtra.com', DEFAULT_TEST_PASSWORD)
}

describe('GET /api/v1/reports/payments', () => {
  it('breaks payouts down by status and computes outstanding/paid totals', async () => {
    await createPayoutRecord({ status: 'Pending', amount: 100 })
    await createPayoutRecord({ status: 'Approved', amount: 200 })
    await createPayoutRecord({ status: 'Paid', amount: 300 })

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/payments').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalOutstanding).toBe(300)
    expect(res.body.data.totalPaid).toBe(300)
    const byStatus = res.body.data.byStatus as { status: string; amount: number }[]
    const pendingRow = byStatus.find((s) => s.status === 'Pending')
    expect(pendingRow?.amount).toBe(100)
  })
})

describe('GET /api/v1/reports/pickups', () => {
  it('computes status breakdown, completion rate, and average turnaround', async () => {
    // `createdAt` is Mongoose-managed and not reliably overridable post-creation, so the
    // turnaround window is anchored to the record's real `createdAt` instead of a fixed date.
    const { pickup } = await createPickupRecord({ status: 'Pending' })
    const completedAt = new Date(pickup.createdAt.getTime() + 24 * 60 * 60 * 1000)
    await Pickup.updateOne({ _id: pickup._id }, { $set: { status: 'Completed', completedAt } })
    await createPickupRecord({ status: 'Pending' })

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/pickups').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalPickups).toBe(2)
    expect(res.body.data.completionRate).toBe(50)
    expect(res.body.data.averageTurnaroundHours).toBe(24)
  })
})

describe('GET /api/v1/reports/inspections', () => {
  it('breaks inspections down by grade/status and computes the rejection rate', async () => {
    await createQualityInspectionRecord({ status: 'Approved', qualityGrade: 'A', inspectedQuantity: 100, acceptedQuantity: 100, rejectedQuantity: 0 })
    await createQualityInspectionRecord({
      status: 'Partially Accepted',
      qualityGrade: 'B',
      inspectedQuantity: 100,
      acceptedQuantity: 75,
      rejectedQuantity: 25,
    })

    const token = await loginAsReportsViewer()
    const res = await request(testApp).get('/api/v1/reports/inspections').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.totalInspections).toBe(2)
    expect(res.body.data.rejectionRatePercent).toBe(12.5)
    const byGrade = res.body.data.byGrade as { grade: string; count: number }[]
    const gradeA = byGrade.find((g) => g.grade === 'A')
    expect(gradeA?.count).toBe(1)
  })
})
