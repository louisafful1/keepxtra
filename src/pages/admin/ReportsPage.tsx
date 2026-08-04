import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { RevenueTrendChart } from '@/components/portal/charts/RevenueTrendChart'
import { MagnitudeBarChart } from '@/components/portal/charts/MagnitudeBarChart'
import { useFarmerAccounts, useInventory, useRevenueTrend, useStorageUtilization } from '@/hooks/useAdminQueries'
import { formatCurrency, formatKg } from '@/utils/format'

function ReportCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
      <h2 className="font-display text-base font-semibold text-neutral-900">{title}</h2>
      <p className="mb-4 text-sm text-neutral-500">{description}</p>
      {children}
    </div>
  )
}

export default function ReportsPage() {
  const seo = buildSeo({ title: 'Reports', description: 'Revenue, inventory, storage, and farmer performance reports.' })
  const { data: revenueTrend } = useRevenueTrend()
  const { data: storageUtilization } = useStorageUtilization()
  const { data: farmers } = useFarmerAccounts()
  const { data: inventory } = useInventory()

  const topFarmers = useMemo(
    () =>
      [...(farmers ?? [])]
        .sort((a, b) => b.totalEarnings - a.totalEarnings)
        .slice(0, 5)
        .map((f) => ({ label: f.name, value: f.totalEarnings })),
    [farmers],
  )

  const inventoryByCrop = useMemo(() => {
    const totals = new Map<string, number>()
    for (const item of inventory ?? []) {
      totals.set(item.crop, (totals.get(item.crop) ?? 0) + item.quantityKg)
    }
    return Array.from(totals, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [inventory])

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Reports" description="Revenue, inventory, storage utilization, and farmer performance." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportCard title="Revenue" description="Monthly revenue and storage fees over the last 6 months.">
          {revenueTrend && <RevenueTrendChart data={revenueTrend} height={220} />}
        </ReportCard>

        <ReportCard title="Storage Utilization" description="Occupied capacity by warehouse.">
          {storageUtilization && (
            <MagnitudeBarChart
              data={storageUtilization.map((s) => ({ label: s.warehouse, value: s.usedPct }))}
              valueFormatter={(v) => `${v}%`}
            />
          )}
        </ReportCard>

        <ReportCard title="Farmer Performance" description="Top 5 farmers by total earnings.">
          <MagnitudeBarChart data={topFarmers} valueFormatter={(v) => formatCurrency(v)} />
        </ReportCard>

        <ReportCard title="Inventory by Crop" description="Total quantity currently in storage, by crop.">
          <MagnitudeBarChart data={inventoryByCrop} valueFormatter={(v) => formatKg(v)} />
        </ReportCard>
      </div>
    </div>
  )
}
