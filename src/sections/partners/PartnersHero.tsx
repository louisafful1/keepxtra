import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GradientBlob } from '@/components/ui/GradientBlob'
import { fadeUp, staggerContainer } from '@/animation/variants'

export function PartnersHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero pb-20 pt-36 sm:pt-40">
      <GradientBlob color="primary" size="xl" className="-left-40 -top-40" />
      <GradientBlob color="secondary" size="lg" className="-right-32 top-1/3" animate={false} />

      <Container className="relative">
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge>Partnerships</Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-balance font-display text-4xl font-medium leading-[1.1] text-primary-800 sm:text-5xl lg:text-6xl"
          >
            Growing together <span className="text-primary-500">across Africa.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="max-w-2xl text-balance text-lg leading-relaxed text-neutral-600">
            KeepXtra collaborates with everyone in the food ecosystem — from the farmers who
            grow it, to the traders, kitchens, and stores that put it in front of people. If
            fresh produce passes through your business, there&apos;s a place for you in our
            network.
          </motion.p>
          <motion.div variants={fadeUp} className="pt-2">
            <Button to="/contact" size="lg" icon>
              Become a Partner
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
