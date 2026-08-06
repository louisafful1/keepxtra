import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { growthStrategySteps } from '@/data/growthStrategy'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function GrowthStrategySection() {
  return (
    <section className="bg-white py-24">
      <Container>
        <SectionHeading eyebrow="Growth Strategy" title="How we scale, deliberately." align="center" />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {growthStrategySteps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div key={step.title} variants={fadeUp} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-medium text-primary-100">
                    0{index + 1}
                  </span>
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                </div>
                <h3 className="font-display text-lg font-medium text-neutral-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{step.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
