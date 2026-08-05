import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { RevenueTrendChart } from '@/components/portal/charts/RevenueTrendChart'
import { MagnitudeBarChart } from '@/components/portal/charts/MagnitudeBarChart'
import { TrendAreaChart } from '@/components/portal/charts/TrendAreaChart'
import {
  useAdminSales,
  useAdminPayouts,
  useAdminPickupRequests,
  useFarmerAccounts,
  useInventory,
  useOrders,
  useRevenueTrend,
  useSalesTrend,
  useStorageUtilization,
} from '@/hooks/useAdminQueries'
import { formatCurrency, formatKg } from '@/utils/format'

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
      <h2 className="font-display text-base font-semibold text-neutral-900">{title}</h2>
      <p className="mb-4 text-sm text-neutral-500">{description}</p>
      {children}
    </div>
  )
}

export default function AnalyticsPage() {
  const seo = buildSeo({ title: 'Analytics', description: 'Growth trends and performance across the entire network.' })
  const { data: revenueTrend } = useRevenueTrend()
  const { data: sales } = useAdminSales()
  const { data: orders } = useOrders()
  const { data: inventory } = useInventory()
  const { data: storageUtilization } = useStorageUtilization()
  const { data: farmers } = useFarmerAccounts()
  const { data: pickups } = useAdminPickupRequests()
  const { data: salesTrend } = useSalesTrend()
  const { data: payouts } = useAdminPayouts()

  const salesByBuyerType = useMemo(() => {
    const totals = new Map<string, number>()
    for (const sale of sales ?? []) {
      totals.set(sale.buyerType, (totals.get(sale.buyerType) ?? 0) + sale.sellingPrice)
    }
    return Array.from(totals, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [sales])

  const orderStatusCounts = useMemo(() => {
    const totals = new Map<string, number>()
    for (const order of orders ?? []) {
      totals.set(order.status, (totals.get(order.status) ?? 0) + 1)
    }
    return Array.from(totals, ([label, count]) => ({ label, count }))
  }, [orders])

  const topProduce = useMemo(() => {
    const totals = new Map<string, number>()
    for (const item of inventory ?? []) {
      if (item.status === 'Disposed') continue
      totals.set(item.crop, (totals.get(item.crop) ?? 0) + item.quantityKg)
    }
    return Array.from(totals, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [inventory])

  const topFarmers = useMemo(() => {
    return [...(farmers ?? [])]
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 6)
      .map((f) => ({ label: f.name, value: f.totalEarnings }))
  }, [farmers])

  const pickupPerformance = useMemo(() => {
    const totals = new Map<string, number>()
    for (const pickup of pickups ?? []) {
      totals.set(pickup.status, (totals.get(pickup.status) ?? 0) + 1)
    }
    return Array.from(totals, ([label, value]) => ({ label, value }))
  }, [pickups])

  const salesTrendPoints = useMemo(() => (salesTrend ?? []).map((p) => ({ label: p.label, value: p.unitsKg })), [salesTrend])

  const paymentTrend = useMemo(() => {
    const totals = new Map<string, number>()
    for (const payout of payouts ?? []) {
      const label = payout.requestedAt.slice(0, 7)
      totals.set(label, (totals.get(label) ?? 0) + payout.amount)
    }
    return Array.from(totals, ([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label))
  }, [payouts])

  const warehouseUtilization = useMemo(
    () => (storageUtilization ?? []).map((p) => ({ label: p.warehouse, value: p.usedPct })),
    [storageUtilization],
  )

  const inventoryByGrade = useMemo(() => {
    const totals = new Map<string, number>()
    for (const item of inventory ?? []) {
      if (item.status === 'Disposed') continue
      totals.set(`Grade ${item.grade}`, (totals.get(`Grade ${item.grade}`) ?? 0) + item.quantityKg)
    }
    return Array.from(totals, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [inventory])

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Analytics" description="Growth trends and where revenue, produce, and performance are coming from." />

      <ChartCard title="Revenue Growth" description="Monthly revenue and storage fees.">
        {revenueTrend && <RevenueTrendChart data={revenueTrend} />}
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Inventory Trends" description="Cold storage composition by grade, across all active inventory.">
          <MagnitudeBarChart data={inventoryByGrade} valueFormatter={(v) => formatKg(v)} />
        </ChartCard>

        <ChartCard title="Warehouse Utilization" description="Capacity used across the warehouse network.">
          <MagnitudeBarChart data={warehouseUtilization} valueFormatter={(v) => `${Math.round(v)}%`} />
        </ChartCard>

        <ChartCard title="Top Produce" description="Highest-volume crops currently moving through the network.">
          <MagnitudeBarChart data={topProduce} valueFormatter={(v) => formatKg(v)} />
        </ChartCard>

        <ChartCard title="Top Farmers" description="Farmers with the highest lifetime earnings.">
          <MagnitudeBarChart data={topFarmers} valueFormatter={(v) => formatCurrency(v)} />
        </ChartCard>

        <ChartCard title="Pickup Performance" description="Where active pickups sit in the collection pipeline.">
          <MagnitudeBarChart data={pickupPerformance} valueFormatter={(v) => String(v)} />
        </ChartCard>

        <ChartCard title="Sales Performance" description="Produce volume sold, month over month.">
          <TrendAreaChart data={salesTrendPoints} valueFormatter={(v) => formatKg(v)} gradientId="salesPerformanceFill" />
        </ChartCard>

        <ChartCard title="Payment Trends" description="Total payout value requested, month over month.">
          <TrendAreaChart data={paymentTrend} color="#CA8A04" valueFormatter={(v) => formatCurrency(v)} gradientId="paymentTrendFill" />
        </ChartCard>

        <ChartCard title="Sales by Buyer Type" description="Revenue contribution by customer segment.">
          <MagnitudeBarChart data={salesByBuyerType} valueFormatter={(v) => formatCurrency(v)} />
        </ChartCard>
      </div>

      <ChartCard title="Orders by Status" description="Current pipeline across all active orders.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {orderStatusCounts.map((s) => (
            <div key={s.label} className="rounded-xl bg-neutral-50 px-4 py-3">
              <p className="text-2xl font-semibold text-neutral-900">{s.count}</p>
              <p className="text-xs text-neutral-500">{s.label}</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
