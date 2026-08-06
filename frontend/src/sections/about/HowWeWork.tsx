import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { howWeWorkSteps } from '@/data/howWeWorkSteps'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function HowWeWork() {
  return (
    <section className="bg-neutral-50 py-24">
      <Container>
        <SectionHeading eyebrow="How We Work" title="One connected process, farm to table." align="center" />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="relative mx-auto mt-16 max-w-2xl"
        >
          <div aria-hidden className="absolute bottom-6 left-6 top-6 w-px bg-primary-200" />

          {howWeWorkSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div key={step.title} variants={fadeUp} className="relative flex gap-6 pb-12 last:pb-0">
                <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-primary-500 bg-white text-primary-600 shadow-soft">
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <div className="pt-1.5">
                  <p className="text-xs font-medium uppercase tracking-widest text-primary-500">
                    Step 0{index + 1}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-medium text-neutral-900">{step.title}</h3>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-neutral-500">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
