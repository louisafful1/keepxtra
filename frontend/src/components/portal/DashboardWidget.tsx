import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/cn'

interface DashboardWidgetProps {
  title: string
  description?: string
  collapsed: boolean
  onToggleCollapse: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  children: ReactNode
  className?: string
}

export function DashboardWidget({
  title,
  description,
  collapsed,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  children,
  className,
}: DashboardWidgetProps) {
  return (
    <div className={cn('rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-neutral-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-neutral-500">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Move widget up"
            title="Move up"
            className="flex size-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Move widget down"
            title="Move down"
            className="flex size-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronDown className="size-4" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="ml-1 rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>
      {!collapsed && <div className="mt-4">{children}</div>}
    </div>
  )
}
