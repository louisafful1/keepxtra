import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { GradientBlob } from '@/components/ui/GradientBlob'
import { fadeUp, staggerContainer, viewportOnce } from '@/animation/variants'

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-28">
      <GradientBlob color="mixed" size="xl" className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

      <Container className="relative">
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-balance font-display text-4xl font-medium leading-[1.1] text-neutral-900 sm:text-6xl"
          >
            Ready to transform the future of food distribution?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-neutral-600">
            Partner with KeepXtra today — and help build the infrastructure powering
            Africa&apos;s fresh produce supply chain.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row">
            <Button to="/partners" variant="primary" size="lg" icon>
              Become a Partner
            </Button>
            <Button to="/contact" variant="secondary" size="lg">
              Request a Delivery
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
