import { Helmet } from 'react-helmet-async'
import { Bell, CheckCheck, CreditCard, PackageCheck, ShoppingBag, Truck } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { AsyncState } from '@/components/portal/AsyncState'
import { useFarmerNotifications, useMarkNotificationRead } from '@/hooks/useFarmerQueries'
import { formatDateTime } from '@/utils/format'
import { cn } from '@/lib/cn'
import type { NotificationType } from '@/types/farmer'

const iconByType: Record<NotificationType, typeof Bell> = {
  pickup: Truck,
  inspection: PackageCheck,
  sale: ShoppingBag,
  payment: CreditCard,
  'storage-reminder': Bell,
}

export default function NotificationsPage() {
  const seo = buildSeo({ title: 'Notifications', description: 'Pickups, inspections, sales, and payment updates.' })
  const { data, isLoading, isError } = useFarmerNotifications()
  const { mutate: markRead } = useMarkNotificationRead()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Notifications" description="Updates on your pickups, produce, and payments." />

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load notifications right now.">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-soft">
          {data?.length ? (
            <ul className="divide-y divide-neutral-100">
              {data.map((n) => {
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
            <div className="flex flex-col items-center gap-2 py-16 text-center text-neutral-400">
              <Bell className="size-6" strokeWidth={1.5} />
              <p className="text-sm">You're all caught up.</p>
            </div>
          )}
        </div>
      </AsyncState>
    </div>
  )
}
