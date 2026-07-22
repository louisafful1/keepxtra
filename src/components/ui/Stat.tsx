import { CountUp } from '@/lib/countup'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { fadeUp } from '@/animation/variants'

interface StatProps {
  value: number
  suffix?: string
  prefix?: string
  decimals?: number
  label: string
  className?: string
  valueClassName?: string
}

export function Stat({ value, suffix, prefix, decimals = 0, label, className, valueClassName }: StatProps) {
  return (
    <motion.div variants={fadeUp} className={cn('flex flex-col gap-2', className)}>
      <div className={cn('font-display text-4xl font-medium tracking-tight text-neutral-900 sm:text-5xl', valueClassName)}>
        <CountUp
          end={value}
          duration={2.4}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          enableScrollSpy
          scrollSpyOnce
          scrollSpyDelay={100}
        />
      </div>
      <p className="text-sm font-medium text-neutral-500">{label}</p>
    </motion.div>
  )
}
