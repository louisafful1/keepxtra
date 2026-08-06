import { Link } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('group flex items-center gap-2.5', className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary-600 shadow-glow transition-transform duration-300 group-hover:scale-105">
        <Sprout className="size-5 text-white" strokeWidth={2} />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-neutral-900">
        KeepXtra
      </span>
    </Link>
  )
}
