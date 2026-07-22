import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -6 } : undefined}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-soft transition-shadow duration-300',
        hover && 'hover:shadow-premium hover:border-neutral-300',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
