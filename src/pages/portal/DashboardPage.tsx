import { Helmet } from 'react-helmet-async'
import { Banknote, Bell, PiggyBank, Truck, Warehouse, Wallet } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { StatCard } from '@/components/portal/StatCard'
import { AsyncState } from '@/components/portal/AsyncState'
import { StatCardSkeletonGrid } from '@/components/portal/Skeleton'
import { ActivityTimeline } from '@/components/portal/ActivityTimeline'
import { DashboardWidget } from '@/components/portal/DashboardWidget'
import { useFarmerActivity, useFarmerDashboard, useFarmerNotifications, useSalesHistory } from '@/hooks/useFarmerQueries'
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatKg, timeAgo } from '@/utils/format'

const WIDGET_IDS = ['activity-timeline', 'recent-sales', 'recent-notifications'] as const
type WidgetId = (typeof WIDGET_IDS)[number]

export default function DashboardPage() {
  const seo = buildSeo({ title: 'Farmer Dashboard', description: 'Your KeepXtra produce, pickups, and earnings at a glance.' })
  const { user } = useAuth()
  const { data: stats, isLoading, isError } = useFarmerDashboard()
  const { data: notifications } = useFarmerNotifications()
  const { data: sales } = useSalesHistory()
  const { data: activity } = useFarmerActivity()
  const widgets = useDashboardWidgets('keepxtra.farmer.dashboard.widgets', [...WIDGET_IDS])

  const widgetContent: Record<WidgetId, { title: string; description?: string; body: React.ReactNode }> = {
    'activity-timeline': {
      title: 'Activity Timeline',
      description: 'Recent updates on your produce.',
      body: <ActivityTimeline events={activity ?? []} />,
    },
    'recent-sales': {
      title: 'Recent Sales',
      body: (
        <>
          <ul className="flex flex-col divide-y divide-neutral-100">
            {sales?.slice(0, 4).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{s.crop}</p>
                  <p className="text-xs text-neutral-500">{formatKg(s.quantityKg)} to {s.buyer}</p>
                </div>
                <span className="text-sm font-medium text-primary-700">{formatCurrency(s.farmerEarnings)}</span>
              </li>
            ))}
          </ul>
          {!sales?.length && <p className="py-6 text-center text-sm text-neutral-400">No sales yet.</p>}
        </>
      ),
    },
    'recent-notifications': {
      title: 'Recent Notifications',
      body: (
        <>
          <ul className="flex flex-col divide-y divide-neutral-100">
            {notifications?.slice(0, 4).map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{n.title}</p>
                  <p className="mt-0.5 text-sm text-neutral-500">{n.message}</p>
                </div>
                <span className="shrink-0 text-xs text-neutral-400">{timeAgo(n.createdAt)}</span>
              </li>
            ))}
          </ul>
          {!notifications?.length && <p className="py-6 text-center text-sm text-neutral-400">No recent activity.</p>}
        </>
      ),
    },
  }

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>

      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'}`} description="Here's what's happening with your produce today." />

      <AsyncState
        isLoading={isLoading}
        isError={isError}
        errorMessage="Couldn't load your dashboard right now."
        loadingSkeleton={<StatCardSkeletonGrid count={6} />}
      >
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Warehouse} label="Produce in Storage" value={formatKg(stats.produceInStorageKg)} />
            <StatCard icon={Truck} label="Pending Pickup Requests" value={String(stats.pendingPickupRequests)} tone="gold" />
            <StatCard icon={Wallet} label="Total Earnings" value={formatCurrency(stats.currentEarnings)} />
            <StatCard icon={PiggyBank} label="Pending Payments" value={formatCurrency(stats.pendingPayments)} tone="gold" />
            <StatCard icon={Banknote} label="Storage Charges" value={formatCurrency(stats.storageCharges)} tone="neutral" />
            <StatCard icon={Bell} label="Notifications" value={String(stats.unreadNotifications)} hint="Unread" tone="gold" />
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
            >
              {widget.body}
            </DashboardWidget>
          )
        })}
      </div>
    </div>
  )
}
