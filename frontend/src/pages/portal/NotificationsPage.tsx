import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { AlertTriangle, Bell, CheckCheck, ClipboardCheck, CreditCard, PackageCheck, Settings2, ShoppingBag, Truck } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { AsyncState } from '@/components/portal/AsyncState'
import { EmptyState } from '@/components/portal/EmptyState'
import { useFarmerNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/hooks/useFarmerQueries'
import { formatDateTime } from '@/utils/format'
import { cn } from '@/lib/cn'
import type { NotificationCategory, NotificationType } from '@/types/farmer'

const iconByType: Record<NotificationType, typeof Bell> = {
  'storage-request': ClipboardCheck,
  pickup: Truck,
  inspection: PackageCheck,
  sale: ShoppingBag,
  payment: CreditCard,
  'storage-reminder': Bell,
  system: Settings2,
  warning: AlertTriangle,
}

const categoryOrder: NotificationCategory[] = ['Inventory', 'Sales', 'Payments', 'Pickups', 'System', 'Warnings', 'Alerts']

export default function NotificationsPage() {
  const seo = buildSeo({ title: 'Notifications', description: 'Pickups, inspections, sales, and payment updates.' })
  const { data, isLoading, isError } = useFarmerNotifications()
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead()
  const [activeCategory, setActiveCategory] = useState<'All' | NotificationCategory>('All')

  const hasUnread = Boolean(data?.some((n) => !n.read))

  const availableCategories = useMemo(() => {
    const present = new Set(data?.map((n) => n.category))
    return categoryOrder.filter((c) => present.has(c))
  }, [data])

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return data ?? []
    return (data ?? []).filter((n) => n.category === activeCategory)
  }, [data, activeCategory])

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader
        title="Notifications"
        description="Updates on your pickups, produce, and payments."
        action={
          hasUnread ? (
            <button
              type="button"
              onClick={() => markAllRead()}
              disabled={isMarkingAll}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
              Mark all as read
            </button>
          ) : undefined
        }
      />

      {availableCategories.length > 1 && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveCategory('All')}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              activeCategory === 'All' ? 'border-primary-500 bg-primary-500 text-white' : 'border-neutral-200 text-neutral-600 hover:border-primary-300 hover:bg-primary-50',
            )}
          >
            All
          </button>
          {availableCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                activeCategory === category ? 'border-primary-500 bg-primary-500 text-white' : 'border-neutral-200 text-neutral-600 hover:border-primary-300 hover:bg-primary-50',
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load notifications right now.">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-soft">
          {filtered.length ? (
            <ul className="divide-y divide-neutral-100">
              {filtered.map((n) => {
                const Icon = iconByType[n.type]
                return (
                  <li key={n.id} className={cn('flex items-start gap-4 px-5 py-4', !n.read && 'bg-primary-50/40')}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <Icon className="size-4.5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                        <span className="shrink-0 text-xs text-neutral-400">{formatDateTime(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-neutral-500">{n.message}</p>
                      <span className="mt-1.5 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">{n.category}</span>
                    </div>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        aria-label="Mark as read"
                        title="Mark as read"
                        className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-primary-600"
                      >
                        <CheckCheck className="size-4" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState icon={Bell} title="No notifications" description={activeCategory === 'All' ? "You're all caught up." : `No ${activeCategory.toLowerCase()} notifications yet.`} />
          )}
        </div>
      </AsyncState>
    </div>
  )
}
