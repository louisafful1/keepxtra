import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface BadgeProps {
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'neutral'
}

const variants = {
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  secondary: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  neutral: 'bg-white text-neutral-600 border-neutral-200',
}

export function Badge({ children, className, variant = 'primary' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
