import { describe, expect, it } from 'vitest'
import { reportService } from '../../src/services/report.service'
import { createPayoutRecord, createPickupRecord } from '../utils/factories'

/** Empty-dataset edge cases every division-guard in report.service.ts needs covered — mirrors the pattern used by every other module's `*.service.defensive.test.ts`. */

describe('ReportService defensive branches', () => {
  it('warehouse report returns 0% average utilization with no warehouses', async () => {
    const result = await reportService.getWarehouseReport()
    expect(result.dto.warehouses).toHaveLength(0)
    expect(result.dto.averageUtilizationPercent).toBe(0)
  })

  it('pickup report returns a 0% completion rate and null average turnaround with no pickups', async () => {
    const result = await reportService.getPickupReport()
    expect(result.dto.totalPickups).toBe(0)
    expect(result.dto.completionRate).toBe(0)
    expect(result.dto.averageTurnaroundHours).toBeNull()
  })

  it('pickup report turnaround stays null when pickups exist but none are Completed', async () => {
    await createPickupRecord({ status: 'Pending' })
    const result = await reportService.getPickupReport()
    expect(result.dto.averageTurnaroundHours).toBeNull()
  })

  it('inspection report returns a 0% rejection rate with no inspections', async () => {
    const result = await reportService.getInspectionReport()
    expect(result.dto.totalInspections).toBe(0)
    expect(result.dto.rejectionRatePercent).toBe(0)
  })

  it('farmer report returns an empty leaderboard with no paid payouts', async () => {
    const result = await reportService.getFarmerReport({ limit: 10 })
    expect(result.dto.topFarmers).toHaveLength(0)
  })

  it('revenue report returns zeroed totals with no confirmed orders', async () => {
    const result = await reportService.getRevenueReport({})
    expect(result.dto.trend).toHaveLength(0)
    expect(result.dto.totals).toEqual({ orderCount: 0, totalRevenue: 0, farmerEarnings: 0, profit: 0 })
  })

  it('fleet report returns 0 costs with no maintenance/fuel records', async () => {
    const result = await reportService.getFleetReport()
    expect(result.dto.totalMaintenanceCost).toBe(0)
    expect(result.dto.totalFuelCost).toBe(0)
  })

  it('payment report returns totalPaid=0 when no payout has ever reached Paid status', async () => {
    await createPayoutRecord({ status: 'Pending', amount: 100 })
    const result = await reportService.getPaymentReport()
    expect(result.dto.totalPaid).toBe(0)
    expect(result.dto.totalOutstanding).toBe(100)
  })
})
