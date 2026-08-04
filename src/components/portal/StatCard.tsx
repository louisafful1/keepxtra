import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  tone?: 'primary' | 'gold' | 'neutral'
  className?: string
}

const toneMap = {
  primary: 'bg-primary-50 text-primary-600',
  gold: 'bg-amber-50 text-amber-600',
  neutral: 'bg-neutral-100 text-neutral-600',
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'primary', className }: StatCardProps) {
  return (
    <div className={cn('rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <span className={cn('flex size-9 items-center justify-center rounded-xl', toneMap[tone])}>
          <Icon className="size-4.5" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-neutral-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  )
}
