import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { fadeUp, staggerContainer, viewportOnce } from '@/animation/variants'
import { Badge } from '@/components/ui/Badge'

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
        <motion.div variants={fadeUp}>
          <Badge>{eyebrow}</Badge>
        </motion.div>
      )}
      <motion.h2
        variants={fadeUp}
        className={cn(
          'text-balance text-4xl font-medium leading-[1.1] text-neutral-900 sm:text-5xl',
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
