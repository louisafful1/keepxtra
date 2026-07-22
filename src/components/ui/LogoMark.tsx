import { cn } from '@/lib/cn'

interface LogoMarkProps {
  name: string
  className?: string
}

/**
 * Placeholder wordmark tile for partner/trust-bar logos until real partner
 * brand assets are supplied — kept as one component so swapping to real
 * logo images later is a single-file change.
 */
export function LogoMark({ name, className }: LogoMarkProps) {
  return (
    <div
      className={cn(
        'flex h-10 shrink-0 items-center justify-center px-4 text-lg font-semibold tracking-tight text-neutral-400 grayscale transition-all duration-300 hover:text-neutral-700 hover:grayscale-0',
        className,
      )}
    >
      {name}
    </div>
  )
}
