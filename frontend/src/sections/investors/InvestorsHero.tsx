import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GradientBlob } from '@/components/ui/GradientBlob'
import { fadeUp, staggerContainer } from '@/animation/variants'
import { pitchDeckUrl } from '@/data/pitchDeck'

export function InvestorsHero() {
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
            <Badge variant="secondary">Investor Relations</Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-balance font-display text-4xl font-medium leading-[1.1] text-primary-800 sm:text-5xl lg:text-6xl"
          >
            Investing in <span className="text-primary-500">Africa&apos;s future food infrastructure.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="max-w-2xl text-balance text-lg leading-relaxed text-neutral-600">
            Africa&apos;s fresh produce supply chain moves billions of dollars in value every
            year through infrastructure that hasn&apos;t caught up with demand. KeepXtra is
            building the cold storage, logistics, and technology layer to capture that
            opportunity — one city at a time.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col gap-4 pt-2 sm:flex-row">
            <Button to="/contact" size="lg" icon>
              Contact Investor Relations
            </Button>
            <Button to={pitchDeckUrl} external download variant="secondary" size="lg">
              Request Pitch Deck
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
