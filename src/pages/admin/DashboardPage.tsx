import { Helmet } from 'react-helmet-async'
import { CalendarClock, ClipboardCheck, Coins, Truck, Users, Warehouse } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { StatCard } from '@/components/portal/StatCard'
import { AsyncState } from '@/components/portal/AsyncState'
import { ActivityTimeline } from '@/components/portal/ActivityTimeline'
import { RevenueTrendChart } from '@/components/portal/charts/RevenueTrendChart'
import { useAdminActivity, useAdminDashboard, useRevenueTrend } from '@/hooks/useAdminQueries'
import { formatCurrency, formatKg, formatNumber } from '@/utils/format'

export default function AdminDashboardPage() {
  const seo = buildSeo({ title: 'Admin Dashboard', description: 'Operational overview of the KeepXtra network.' })
  const { data: stats, isLoading, isError } = useAdminDashboard()
  const { data: trend } = useRevenueTrend()
  const { data: activity } = useAdminActivity()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Overview" description="How the KeepXtra network is performing right now." />

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load dashboard stats right now.">
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Registered Farmers" value={formatNumber(stats.registeredFarmers)} />
            <StatCard icon={Warehouse} label="Produce in Storage" value={formatKg(stats.produceInStorageKg)} />
            <StatCard icon={Truck} label="Today's Pickups" value={String(stats.todaysPickups)} tone="gold" />
            <StatCard icon={Coins} label="Inventory Value" value={formatCurrency(stats.inventoryValue)} />
            <StatCard icon={Warehouse} label="Warehouse Occupancy" value={`${stats.warehouseOccupancyPct}%`} tone="neutral" />
            <StatCard icon={Coins} label="Revenue" value={formatCurrency(stats.revenue)} />
            <StatCard icon={ClipboardCheck} label="Pending Approvals" value={String(stats.pendingApprovals)} tone="gold" />
            <StatCard icon={CalendarClock} label="Upcoming Deliveries" value={String(stats.upcomingDeliveries)} />
          </div>
        )}
      </AsyncState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
          <h2 className="font-display text-base font-semibold text-neutral-900">Revenue trend</h2>
          <p className="mb-4 text-sm text-neutral-500">Last 6 months</p>
          {trend && <RevenueTrendChart data={trend} />}
        </div>

        <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
          <h2 className="font-display text-base font-semibold text-neutral-900">Activity Timeline</h2>
          <p className="mb-4 text-sm text-neutral-500">What just happened across the network.</p>
          <ActivityTimeline events={activity ?? []} />
        </div>
      </div>
    </div>
  )
}
