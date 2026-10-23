import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { marketDrivers, marketStat } from '@/data/marketOpportunity'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function MarketOpportunity() {
  return (
    <section className="bg-white py-24">
      <Container>
        <SectionHeading
          eyebrow="Market Opportunity"
          title="A market growing faster than infrastructure can keep up."
          align="center"
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 flex flex-col items-center gap-2 text-center"
        >
          <p className="font-display text-5xl font-bold leading-none text-primary-700 sm:text-6xl">
            {marketStat.value}
          </p>
          <p className="max-w-xl text-base leading-relaxed text-neutral-600">{marketStat.label}</p>
          <p className="text-xs text-neutral-400">Source: {marketStat.source}</p>
        </motion.div>

        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {marketDrivers.map((driver) => (
            <motion.div key={driver.title} variants={fadeUp} className="h-full">
              <Card hover={false} className="flex h-full flex-col gap-3">
                <h3 className="font-display text-lg font-medium text-neutral-900">{driver.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{driver.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
