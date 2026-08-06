import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { fadeUp, staggerContainer, viewportOnce } from '@/animation/variants'

export function VisionSection() {
  return (
    <section className="bg-primary-800 py-24">
      <Container narrow>
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="flex flex-col items-center gap-5 text-center"
        >
          <motion.p
            variants={fadeUp}
            className="text-xs font-medium uppercase tracking-widest text-primary-300"
          >
            Our Vision
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-balance font-display text-3xl font-medium leading-tight text-white sm:text-4xl"
          >
            To become Africa&apos;s leading fresh produce logistics and storage
            infrastructure company.
          </motion.h2>
        </motion.div>
      </Container>
    </section>
  )
}
