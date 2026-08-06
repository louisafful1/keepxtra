import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-50 text-primary-500">
        <Icon className="size-6" strokeWidth={1.5} />
      </span>
      <div>
        <p className="text-sm font-medium text-neutral-700">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-neutral-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}
