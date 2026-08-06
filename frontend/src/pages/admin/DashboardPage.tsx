import { Helmet } from 'react-helmet-async'
import { CalendarClock, ClipboardCheck, Coins, Truck, Users, Warehouse } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { StatCard } from '@/components/portal/StatCard'
import { AsyncState } from '@/components/portal/AsyncState'
import { StatCardSkeletonGrid } from '@/components/portal/Skeleton'
import { ActivityTimeline } from '@/components/portal/ActivityTimeline'
import { DashboardWidget } from '@/components/portal/DashboardWidget'
import { RevenueTrendChart } from '@/components/portal/charts/RevenueTrendChart'
import { MagnitudeBarChart } from '@/components/portal/charts/MagnitudeBarChart'
import { useAdminActivity, useAdminDashboard, useRevenueTrend, useStorageUtilization } from '@/hooks/useAdminQueries'
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets'
import { formatCurrency, formatKg, formatNumber } from '@/utils/format'

const WIDGET_IDS = ['revenue-trend', 'activity-timeline', 'cold-storage-snapshot'] as const
type WidgetId = (typeof WIDGET_IDS)[number]

export default function AdminDashboardPage() {
  const seo = buildSeo({ title: 'Admin Dashboard', description: 'Operational overview of the KeepXtra network.' })
  const { data: stats, isLoading, isError } = useAdminDashboard()
  const { data: trend } = useRevenueTrend()
  const { data: activity } = useAdminActivity()
  const { data: storageUtilization } = useStorageUtilization()
  const widgets = useDashboardWidgets('keepxtra.admin.dashboard.widgets', [...WIDGET_IDS])

  const widgetContent: Record<WidgetId, { title: string; description: string; wide?: boolean; body: React.ReactNode }> = {
    'revenue-trend': {
      title: 'Revenue Trend',
      description: 'Last 6 months',
      wide: true,
      body: trend && <RevenueTrendChart data={trend} />,
    },
    'activity-timeline': {
      title: 'Activity Timeline',
      description: "What just happened across the network.",
      body: <ActivityTimeline events={activity ?? []} />,
    },
    'cold-storage-snapshot': {
      title: 'Cold Storage Snapshot',
      description: 'Capacity used per warehouse.',
      body: storageUtilization && (
        <MagnitudeBarChart data={storageUtilization.map((p) => ({ label: p.warehouse, value: p.usedPct }))} valueFormatter={(v) => `${Math.round(v)}%`} />
      ),
    },
  }

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Overview" description="How the KeepXtra network is performing right now." />

      <AsyncState
        isLoading={isLoading}
        isError={isError}
        errorMessage="Couldn't load dashboard stats right now."
        loadingSkeleton={<StatCardSkeletonGrid count={8} />}
      >
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {widgets.order.map((id, index) => {
          const widget = widgetContent[id as WidgetId]
          if (!widget) return null
          return (
            <DashboardWidget
              key={id}
              title={widget.title}
              description={widget.description}
              collapsed={widgets.isCollapsed(id)}
              onToggleCollapse={() => widgets.toggleCollapse(id)}
              onMoveUp={() => widgets.moveUp(id)}
              onMoveDown={() => widgets.moveDown(id)}
              canMoveUp={index > 0}
              canMoveDown={index < widgets.order.length - 1}
              className={widget.wide ? 'xl:col-span-2' : undefined}
            >
              {widget.body}
            </DashboardWidget>
          )
        })}
      </div>
    </div>
  )
}
