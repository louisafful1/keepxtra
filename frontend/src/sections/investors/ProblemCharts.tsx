import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { problemMetrics } from '@/data/problemMetrics'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function ProblemCharts() {
  return (
    <section className="bg-white py-24">
      <Container>
        <SectionHeading
          eyebrow="The Problem"
          title="A market held back by broken infrastructure."
          description="The structural problems holding back fresh-produce logistics in Africa."
          align="center"
        />

        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {problemMetrics.map((metric) => (
            <motion.div key={metric.label} variants={fadeUp}>
              <Card hover={false} className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-lg font-medium text-neutral-900">{metric.label}</h3>
                  {typeof metric.value === 'number' && (
                    <span className="font-display text-3xl font-medium text-primary-700">
                      {metric.value}%
                    </span>
                  )}
                </div>
                {typeof metric.value === 'number' && (
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary-100">
                    <motion.div
                      className="h-full rounded-full bg-primary-500"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${metric.value}%` }}
                      viewport={viewportOnce}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                )}
                <p className="text-sm leading-relaxed text-neutral-500">{metric.description}</p>
                {metric.source && (
                  <p className="text-xs text-neutral-400">Source: {metric.source}</p>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
