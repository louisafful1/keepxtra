import { motion } from 'framer-motion'
import { CountUp } from '@/lib/countup'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { impactStats } from '@/data/impactStats'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function ImpactCounters() {
  return (
    <section className="bg-tint-green py-20 lg:py-28">
      <Container>
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="flex flex-col items-start gap-4 lg:max-w-xs lg:shrink-0"
          >
            <motion.div variants={fadeUp}>
              <Badge>Our Impact</Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-balance font-display text-4xl font-medium leading-tight text-neutral-900"
            >
              Measurable change, at scale.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-neutral-600">
              We&apos;re building a more efficient, sustainable, and inclusive food system
              for Africa.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button to="/about" variant="primary" icon>
                See Our Impact
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4"
          >
            {impactStats.map((stat) => {
              const Icon = stat.icon
              return (
                <motion.div key={stat.label} variants={fadeUp} className="flex flex-col items-start gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-white shadow-soft">
                    <Icon
                      className={stat.accent ? 'size-5 text-secondary-500' : 'size-5 text-primary-600'}
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
        </div>
      </Container>
    </section>
  )
}
