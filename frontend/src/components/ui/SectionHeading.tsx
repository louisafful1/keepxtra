import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { fadeUp, staggerContainer, viewportOnce } from '@/animation/variants'

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
  titleClassName?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  titleClassName,
}: SectionHeadingProps) {
  return (
    <motion.div
      variants={staggerContainer(0.12)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={cn(
        'flex max-w-3xl flex-col gap-5',
        align === 'center' && 'mx-auto items-center text-center',
        className,
      )}
    >
      {eyebrow && (
        <motion.p
          variants={fadeUp}
          className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-600"
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        variants={fadeUp}
        className={cn(
          'text-balance text-4xl font-bold leading-[1.08] tracking-[-0.02em] text-neutral-900 sm:text-5xl',
          titleClassName,
        )}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p variants={fadeUp} className="text-balance text-lg leading-relaxed text-neutral-500">
          {description}
        </motion.p>
      )}
    </motion.div>
  )
}
