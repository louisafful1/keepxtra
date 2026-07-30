import { motion } from 'framer-motion'
import { TrendingDown, Users, ShoppingCart } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Stat } from '@/components/ui/Stat'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

const problemStats = [
  { value: 40, suffix: '%', label: 'Of harvested produce lost before it reaches a buyer' },
  { value: 4, prefix: '$', suffix: 'B+', label: 'In value lost across African food supply chains yearly' },
  { value: 30, suffix: '%', label: 'Of potential farmer income lost to spoilage' },
  { value: 2, suffix: 'x', label: 'Price markup consumers pay for inconsistent supply' },
]

const painPoints = [
  {
    icon: TrendingDown,
    title: 'Farmers lose income',
    description:
      'Without reliable storage, produce spoils before it can be sold — turning a harvest into a loss.',
  },
  {
    icon: Users,
    title: 'Buyers face inconsistent supply',
    description:
      'Restaurants, hotels, and retailers struggle to plan around unpredictable, fragmented sourcing.',
  },
  {
    icon: ShoppingCart,
    title: 'Consumers pay more',
    description:
      'Inefficiency and waste in the chain get passed on as higher prices at the till.',
  },
]

export function ProblemStats() {
  return (
    <section className="bg-white py-28">
      <Container>
        <SectionHeading
          eyebrow="The Problem"
          title={
            <>
              Every year, Africa loses what it can&apos;t afford to{' '}
              <span className="text-primary-500">waste.</span>
            </>
          }
          description="Poor storage and fragmented distribution mean fresh produce rarely makes it from farm to buyer intact — and everyone in the chain pays for it."
        />

        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-16 grid grid-cols-2 gap-8 border-y border-neutral-200 py-12 sm:grid-cols-4"
        >
          {problemStats.map((stat) => (
            <Stat key={stat.label} {...stat} />
          ))}
        </motion.div>

        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {painPoints.map((point) => {
            const Icon = point.icon
            return (
              <motion.div
                key={point.title}
                variants={fadeUp}
                className="flex flex-col gap-4 rounded-3xl bg-neutral-50 p-8"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-600">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="font-display text-lg font-medium text-neutral-900">
                  {point.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-500">{point.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
