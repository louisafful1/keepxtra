import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { investorRoadmap } from '@/data/investorRoadmap'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function InvestorRoadmapSection() {
  return (
    <section className="bg-neutral-50 py-24">
      <Container>
        <SectionHeading eyebrow="Roadmap" title="Where we're headed." align="center" />

        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-primary-300 to-transparent lg:block"
          />

          {investorRoadmap.map((milestone) => (
            <motion.div
              key={milestone.year}
              variants={fadeUp}
              className="relative flex flex-col items-center gap-3 text-center"
            >
              <span className="relative z-10 flex size-12 items-center justify-center rounded-full border-2 border-primary-500 bg-white font-display text-sm font-semibold text-primary-700 shadow-soft">
                {milestone.year}
              </span>
              <h3 className="font-display text-lg font-medium text-neutral-900">{milestone.title}</h3>
              <p className="max-w-[16rem] text-sm leading-relaxed text-neutral-500">{milestone.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
