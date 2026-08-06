import type { LucideIcon } from 'lucide-react'
import { ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

interface ImageSlotProps {
  src?: string
  alt: string
  /** Shown only in placeholder mode (no src) — keeps swap-in-later spots self-documenting. */
  label?: string
  icon?: LucideIcon
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide'
  rounded?: '2xl' | '3xl'
  className?: string
}

const aspectMap = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[16/7]',
}

const roundedMap = {
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
}

/**
 * Single choke point for every "photo" spot on the site. Today it renders a
 * branded light-tint placeholder; dropping in a real `src` later (KeepXtra
 * operations photography) is a one-line change per usage.
 */
export function ImageSlot({
  src,
  alt,
  label,
  icon: Icon = ImageIcon,
  aspectRatio = 'square',
  rounded = '3xl',
  className,
}: ImageSlotProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden border border-neutral-200 shadow-soft',
        aspectMap[aspectRatio],
        roundedMap[rounded],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="relative size-full bg-gradient-hero">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(#16A34A 1px, transparent 1px), linear-gradient(90deg, #16A34A 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="relative flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="flex size-14 items-center justify-center rounded-2xl border border-primary-200 bg-white shadow-soft"
            >
              <Icon className="size-6 text-primary-600" strokeWidth={1.5} />
            </motion.div>
            {label && (
              <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                {label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
