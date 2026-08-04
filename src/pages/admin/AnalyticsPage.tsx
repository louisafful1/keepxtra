import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { RevenueTrendChart } from '@/components/portal/charts/RevenueTrendChart'
import { MagnitudeBarChart } from '@/components/portal/charts/MagnitudeBarChart'
import { useAdminSales, useOrders, useRevenueTrend } from '@/hooks/useAdminQueries'
import { formatCurrency } from '@/utils/format'

export default function AnalyticsPage() {
  const seo = buildSeo({ title: 'Analytics', description: 'Growth trends and sales composition across the network.' })
  const { data: revenueTrend } = useRevenueTrend()
  const { data: sales } = useAdminSales()
  const { data: orders } = useOrders()

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

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Analytics" description="Growth trends and where revenue is coming from." />

      <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
        <h2 className="font-display text-base font-semibold text-neutral-900">Revenue growth</h2>
        <p className="mb-4 text-sm text-neutral-500">Monthly revenue and storage fees.</p>
        {revenueTrend && <RevenueTrendChart data={revenueTrend} />}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
          <h2 className="font-display text-base font-semibold text-neutral-900">Sales by buyer type</h2>
          <p className="mb-4 text-sm text-neutral-500">Revenue contribution by customer segment.</p>
          <MagnitudeBarChart data={salesByBuyerType} valueFormatter={(v) => formatCurrency(v)} />
        </div>

        <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
          <h2 className="font-display text-base font-semibold text-neutral-900">Orders by status</h2>
          <p className="mb-4 text-sm text-neutral-500">Current pipeline across all active orders.</p>
          <div className="grid grid-cols-2 gap-3">
            {orderStatusCounts.map((s) => (
              <div key={s.label} className="rounded-xl bg-neutral-50 px-4 py-3">
                <p className="text-2xl font-semibold text-neutral-900">{s.count}</p>
                <p className="text-xs text-neutral-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
