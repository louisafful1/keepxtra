import { motion } from 'framer-motion'
import { CountUp } from '@/lib/countup'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { impactStats } from '@/data/impactStats'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function AboutImpact() {
  return (
    <section className="bg-tint-green py-24">
      <Container>
        <SectionHeading eyebrow="Our Impact" title="Progress you can measure." align="center" />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4"
        >
          {impactStats.map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div key={stat.label} variants={fadeUp} className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-white shadow-soft">
                  <Icon
                    className={stat.accent ? 'size-7 text-secondary-500' : 'size-7 text-primary-600'}
                    strokeWidth={1.75}
                  />
                </span>
                <div
                  className={
                    stat.accent
                      ? 'font-display text-3xl font-medium text-secondary-500 sm:text-4xl'
                      : 'font-display text-3xl font-medium text-primary-600 sm:text-4xl'
                  }
                >
                  <CountUp
                    end={stat.value}
                    duration={2.4}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    separator=","
                    enableScrollSpy
                    scrollSpyOnce
                    scrollSpyDelay={100}
                  />
                </div>
                <p className="max-w-[9rem] text-sm text-neutral-600">{stat.label}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
