import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Wordmark } from '@/components/layout/Wordmark'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="KeepXtra home"
      className={cn('group inline-flex items-center', className)}
    >
      <Wordmark className="text-xl transition-opacity duration-300 group-hover:opacity-80" />
    </Link>
  )
}
