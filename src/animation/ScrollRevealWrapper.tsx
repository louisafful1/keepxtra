import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { fadeUp, viewportOnce } from '@/animation/variants'

interface ScrollRevealWrapperProps {
  children: ReactNode
  variants?: Variants
  className?: string
  delay?: number
}

export function ScrollRevealWrapper({
  children,
  variants = fadeUp,
  className,
  delay = 0,
}: ScrollRevealWrapperProps) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
