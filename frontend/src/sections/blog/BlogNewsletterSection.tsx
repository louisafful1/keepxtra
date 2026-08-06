import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { GradientBlob } from '@/components/ui/GradientBlob'
import { NewsletterForm } from '@/components/layout/NewsletterForm'
import { fadeUp, staggerContainer, viewportOnce } from '@/animation/variants'

export function BlogNewsletterSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-24">
      <GradientBlob color="mixed" size="lg" className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

      <Container className="relative">
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-balance font-display text-3xl font-medium leading-tight text-primary-800 sm:text-4xl"
          >
            Get new articles in your inbox.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-balance text-lg leading-relaxed text-neutral-600">
            No spam — just insights on food logistics, cold storage, and building resilient
            supply chains.
          </motion.p>
          <motion.div variants={fadeUp} className="w-full max-w-sm">
            <NewsletterForm />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
