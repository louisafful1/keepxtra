import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface MarqueeProps {
  children: ReactNode[]
  className?: string
  reverse?: boolean
}

/** Infinite-scroll row: renders children twice back-to-back and animates -50%. */
export function Marquee({ children, className, reverse = false }: MarqueeProps) {
  return (
    <div className={cn('group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center gap-16 pr-16 animate-marquee group-hover:[animation-play-state:paused]',
          reverse && '[animation-direction:reverse]',
        )}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          'flex shrink-0 items-center gap-16 pr-16 animate-marquee group-hover:[animation-play-state:paused]',
          reverse && '[animation-direction:reverse]',
        )}
      >
        {children}
      </div>
    </div>
  )
}
