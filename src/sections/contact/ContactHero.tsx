import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { fadeUp, staggerContainer, viewportOnce } from '@/animation/variants'

export function ContactHero() {
  return (
    <section className="bg-neutral-50 pb-16 pt-36 sm:pt-40">
      <Container>
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="flex max-w-2xl flex-col gap-5"
        >
          <motion.div variants={fadeUp}>
            <Badge>Contact</Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-balance font-display text-4xl font-medium leading-[1.1] text-primary-800 sm:text-5xl"
          >
            Let&apos;s talk about your <span className="text-primary-500">supply chain.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-balance text-lg leading-relaxed text-neutral-500">
            Whether you&apos;re a farmer, trader, restaurant, retailer, or investor — reach out
            and our team will get back to you.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  )
}
