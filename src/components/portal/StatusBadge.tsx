import { getStatusClasses } from '@/utils/statusStyles'
import { cn } from '@/lib/cn'

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = getStatusClasses(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        tone.bg,
        tone.text,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', tone.dot)} />
      {status}
    </span>
  )
}
