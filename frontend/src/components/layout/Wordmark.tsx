import { cn } from '@/lib/cn'

interface WordmarkProps {
  className?: string
  /** `light` is for dark surfaces — green is unreadable there. */
  tone?: 'default' | 'light'
}

/**
 * KeepXtra wordmark — name only, no icon tile.
 * The "X" is a custom mark: two leaves crossing, each with a leaf-vein cut-out
 * (transparent, so it works on any surface colour).
 */
export function Wordmark({ className, tone = 'default' }: WordmarkProps) {
  const light = tone === 'light'

  return (
    <span
      className={cn(
        'inline-flex items-baseline whitespace-nowrap font-display font-bold leading-none tracking-[-0.04em]',
        light ? 'text-white' : 'text-primary-700',
        className,
      )}
    >
      Keep
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        className={cn(
          'mx-[0.03em] inline-block h-[0.74em] w-[0.74em] text-secondary-500',
          light && 'text-secondary-400',
        )}
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M6 94 C 23 52 53 22 94 6 C 78 48 48 78 6 94 Z
             M54 46 C 60 40 70 30 78 22 C 72 34 62 44 54 46 Z
             M46 54 C 40 60 30 70 22 78 C 28 66 38 56 46 54 Z"
        />
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M94 94 C 77 52 47 22 6 6 C 22 48 52 78 94 94 Z
             M46 46 C 40 40 30 30 22 22 C 28 34 38 44 46 46 Z
             M54 54 C 60 60 70 70 78 78 C 72 66 62 56 54 54 Z"
        />
      </svg>
      tra
    </span>
  )
}

