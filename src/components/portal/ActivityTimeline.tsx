import {
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  ShoppingBag,
  Truck,
  UserCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityEvent, ActivityType } from '@/types/activity'
import { timeAgo } from '@/utils/format'
import { cn } from '@/lib/cn'

const iconByType: Record<ActivityType, LucideIcon> = {
  'storage-request-created': ClipboardCheck,
  'storage-request-approved': CheckCircle2,
  'storage-request-rejected': XCircle,
  'storage-request-info-requested': ClipboardCheck,
  'pickup-approved': CheckCircle2,
  'driver-assigned': UserCheck,
  'produce-collected': Truck,
  'produce-received': PackageCheck,
  'inspection-completed': ClipboardCheck,
  'sale-completed': ShoppingBag,
  'payment-requested': Banknote,
  'payment-approved': CheckCircle2,
  'payment-rejected': XCircle,
  'payment-sent': Banknote,
}

const toneByType: Record<ActivityType, string> = {
  'storage-request-created': 'bg-blue-50 text-blue-600',
  'storage-request-approved': 'bg-primary-50 text-primary-600',
  'storage-request-rejected': 'bg-red-50 text-red-500',
  'storage-request-info-requested': 'bg-amber-50 text-amber-600',
  'pickup-approved': 'bg-primary-50 text-primary-600',
  'driver-assigned': 'bg-blue-50 text-blue-600',
  'produce-collected': 'bg-blue-50 text-blue-600',
  'produce-received': 'bg-primary-50 text-primary-600',
  'inspection-completed': 'bg-amber-50 text-amber-600',
  'sale-completed': 'bg-primary-50 text-primary-600',
  'payment-requested': 'bg-amber-50 text-amber-600',
  'payment-approved': 'bg-primary-50 text-primary-600',
  'payment-rejected': 'bg-red-50 text-red-500',
  'payment-sent': 'bg-primary-50 text-primary-600',
}

export function ActivityTimeline({ events, emptyMessage = 'No activity yet.' }: { events: ActivityEvent[]; emptyMessage?: string }) {
  if (!events.length) {
    return <p className="py-8 text-center text-sm text-neutral-400">{emptyMessage}</p>
  }

  return (
    <ol className="relative flex flex-col gap-6 pl-2">
      <div aria-hidden className="absolute bottom-4 left-[19px] top-4 w-px bg-neutral-200" />
      {events.map((event) => {
        const Icon = iconByType[event.type]
        return (
          <li key={event.id} className="relative flex gap-3.5">
            <span className={cn('relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white', toneByType[event.type])}>
              <Icon className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-neutral-900">{event.title}</p>
                <span className="shrink-0 text-xs text-neutral-400">{timeAgo(event.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-sm text-neutral-500">{event.description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
