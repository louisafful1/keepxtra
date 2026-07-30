import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { GradientBlob } from '@/components/ui/GradientBlob'
import { fadeUp, staggerContainer } from '@/animation/variants'

export function ServicesHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero pb-20 pt-36 sm:pt-40">
      <GradientBlob color="primary" size="xl" className="-left-40 -top-40" />
      <GradientBlob color="secondary" size="lg" className="-right-32 top-1/3" animate={false} />

      <Container className="relative">
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge>Our Services</Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-balance font-display text-4xl font-medium leading-[1.1] text-primary-800 sm:text-5xl lg:text-6xl"
          >
            End-to-end infrastructure for <span className="text-primary-500">fresh produce.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-balance max-w-2xl text-lg leading-relaxed text-neutral-600">
            From the moment a harvest is collected to the moment it reaches a kitchen or a
            home, KeepXtra runs every layer of the supply chain in between — so nothing is
            left to chance.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  )
}
