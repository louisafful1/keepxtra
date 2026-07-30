import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { investorImpactPillars } from '@/data/investorImpact'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function ImpactEsgSection() {
  return (
    <section className="bg-primary-800 py-24">
      <Container>
        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center"
        >
          <motion.p variants={fadeUp} className="text-xs font-medium uppercase tracking-widest text-primary-300">
            Impact
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
            Returns and impact, built together.
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {investorImpactPillars.map((pillar) => (
            <motion.div key={pillar.title} variants={fadeUp}>
              <Card hover={false} className="flex h-full flex-col gap-4 border-primary-700 bg-primary-800/60">
                <IconTile icon={pillar.icon} className="bg-primary-700 text-primary-200" />
                <div>
                  <h3 className="font-display text-lg font-medium text-white">{pillar.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-primary-200">{pillar.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
