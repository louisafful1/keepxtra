import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { fadeUp, staggerContainer, viewportOnce } from '@/animation/variants'

export function OurStory() {
  return (
    <section className="bg-white py-24">
      <Container narrow>
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="flex flex-col gap-6"
        >
          <motion.div variants={fadeUp}>
            <Badge>Our Story</Badge>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-balance font-display text-3xl font-medium leading-tight text-primary-800 sm:text-4xl"
          >
            From a simple question to a growing network.
          </motion.h2>

          <motion.p variants={fadeUp} className="text-lg leading-relaxed text-neutral-600">
            Across Ghana and much of Africa, harvests are abundant — but the systems to move
            them safely from farm to table haven&apos;t kept pace. Produce often travels for
            hours in open trucks, sits in markets without refrigeration, and changes hands
            through multiple informal middlemen before it ever reaches a buyer. By the time
            it does, a large share of it has already spoiled.
          </motion.p>

          <motion.p variants={fadeUp} className="text-lg leading-relaxed text-neutral-600">
            KeepXtra was founded to close that gap — not with another marketplace app, but
            with the physical infrastructure the industry was missing: cold storage, quality
            control, and a logistics network built specifically for perishable goods. We
            started with a simple question: what would it take for a farmer&apos;s harvest to
            reach a restaurant&apos;s kitchen exactly as fresh as the day it was picked?
          </motion.p>

          <motion.blockquote
            variants={fadeUp}
            className="border-l-4 border-secondary-500 bg-secondary-500/10 px-6 py-5 font-display text-2xl font-medium leading-snug text-primary-800"
          >
            We&apos;re not just moving produce. We&apos;re building the infrastructure
            Africa&apos;s food system was missing.
          </motion.blockquote>

          <motion.p variants={fadeUp} className="text-lg leading-relaxed text-neutral-600">
            That question became a cold room, then a delivery route, then a growing network
            connecting farmers and traders to the businesses and households that depend on
            them. Every tonne of food we save is income kept in a farmer&apos;s pocket, and
            every reliable delivery is one less business forced to guess at its supply.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  )
}
