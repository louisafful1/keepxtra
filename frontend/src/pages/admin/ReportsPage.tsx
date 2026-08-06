import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Download, Printer } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { RevenueTrendChart } from '@/components/portal/charts/RevenueTrendChart'
import { MagnitudeBarChart } from '@/components/portal/charts/MagnitudeBarChart'
import {
  useFarmerAccounts,
  useInventory,
  useRevenueTrend,
  useSalesTrend,
  useStorageUtilization,
} from '@/hooks/useAdminQueries'
import { formatCurrency, formatKg } from '@/utils/format'
import { exportToCsv } from '@/utils/exportCsv'

function ReportCard({
  title,
  description,
  onExport,
  children,
}: {
  title: string
  description: string
  onExport?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-neutral-900">{title}</h2>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 print:hidden"
          >
            <Download className="size-3.5" /> CSV
          </button>
        )}
      </div>
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
  const { data: salesTrend } = useSalesTrend()

  const topFarmers = useMemo(
    () =>
      [...(farmers ?? [])]
        .sort((a, b) => b.totalEarnings - a.totalEarnings)
        .slice(0, 5)
        .map((f) => ({ label: f.name, value: f.totalEarnings })),
    [farmers],
  )

  const topCrops = useMemo(() => {
    const totals = new Map<string, number>()
    for (const item of inventory ?? []) {
      totals.set(item.crop, (totals.get(item.crop) ?? 0) + item.quantityKg)
    }
    return Array.from(totals, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [inventory])

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader
        title="Reports"
        description="Revenue, inventory, storage utilization, and farmer performance."
        action={
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 print:hidden"
          >
            <Printer className="size-4" /> Export PDF
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportCard
          title="Revenue"
          description="Monthly revenue and storage fees over the last 6 months."
          onExport={() => revenueTrend && exportToCsv('revenue-report', revenueTrend)}
        >
          {revenueTrend && <RevenueTrendChart data={revenueTrend} height={220} />}
        </ReportCard>

        <ReportCard
          title="Sales Trends"
          description="Total volume sold (kg) over the last 6 months."
          onExport={() => salesTrend && exportToCsv('sales-trends-report', salesTrend)}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} width={36} />
              <Tooltip formatter={(value) => formatKg(Number(value))} />
              <Area type="monotone" dataKey="unitsKg" name="Units Sold" stroke="#16A34A" strokeWidth={2} fill="url(#salesFill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ReportCard>

        <ReportCard
          title="Storage Utilization"
          description="Occupied capacity by warehouse."
          onExport={() => storageUtilization && exportToCsv('storage-utilization-report', storageUtilization)}
        >
          {storageUtilization && (
            <MagnitudeBarChart
              data={storageUtilization.map((s) => ({ label: s.warehouse, value: s.usedPct }))}
              valueFormatter={(v) => `${v}%`}
            />
          )}
        </ReportCard>

        <ReportCard
          title="Top Farmers"
          description="Top 5 farmers by total earnings."
          onExport={() => exportToCsv('top-farmers-report', topFarmers.map((f) => ({ farmer: f.label, earnings: f.value })))}
        >
          <MagnitudeBarChart data={topFarmers} valueFormatter={(v) => formatCurrency(v)} />
        </ReportCard>

        <ReportCard
          title="Top Crops"
          description="Top 5 crops by quantity currently in storage."
          onExport={() => exportToCsv('top-crops-report', topCrops.map((c) => ({ crop: c.label, quantityKg: c.value })))}
        >
          <MagnitudeBarChart data={topCrops} valueFormatter={(v) => formatKg(v)} />
        </ReportCard>
      </div>
    </div>
  )
}
