import { Helmet } from 'react-helmet-async'
import { Boxes, CalendarClock, Truck, Users, Warehouse, Wallet } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { StatCard } from '@/components/portal/StatCard'
import { AsyncState } from '@/components/portal/AsyncState'
import { RevenueTrendChart } from '@/components/portal/charts/RevenueTrendChart'
import { useAdminDashboard, useRevenueTrend } from '@/hooks/useAdminQueries'
import { formatCurrency, formatKg, formatNumber } from '@/utils/format'

export default function AdminDashboardPage() {
  const seo = buildSeo({ title: 'Admin Dashboard', description: 'Operational overview of the KeepXtra network.' })
  const { data: stats, isLoading, isError } = useAdminDashboard()
  const { data: trend } = useRevenueTrend()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Overview" description="How the KeepXtra network is performing right now." />

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load dashboard stats right now.">
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Users} label="Registered Farmers" value={formatNumber(stats.registeredFarmers)} />
            <StatCard icon={Warehouse} label="Produce in Storage" value={formatKg(stats.produceInStorageKg)} />
            <StatCard icon={Truck} label="Pending Pickups" value={String(stats.pendingPickups)} tone="gold" />
            <StatCard icon={CalendarClock} label="Today's Deliveries" value={String(stats.todaysDeliveries)} />
            <StatCard icon={Wallet} label="Revenue" value={formatCurrency(stats.revenue)} />
            <StatCard icon={Boxes} label="Storage Capacity Used" value={`${stats.storageCapacityUsedPct}%`} tone="neutral" />
          </div>
        )}
      </AsyncState>

      <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
        <h2 className="font-display text-base font-semibold text-neutral-900">Revenue trend</h2>
        <p className="mb-4 text-sm text-neutral-500">Last 6 months</p>
        {trend && <RevenueTrendChart data={trend} />}
      </div>
    </div>
  )
}
