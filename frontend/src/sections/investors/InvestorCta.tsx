import { motion } from 'framer-motion'
import { Download, Mail } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { GradientBlob } from '@/components/ui/GradientBlob'
import { fadeUp, staggerContainer, viewportOnce } from '@/animation/variants'
import { contactEmail } from '@/data/contactInfo'
import { pitchDeckUrl } from '@/data/pitchDeck'

export function InvestorCta() {
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
            className="text-balance font-display text-4xl font-medium leading-[1.1] text-primary-800 sm:text-6xl"
          >
            Let&apos;s build <span className="text-primary-500">Africa&apos;s food infrastructure</span> together.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-neutral-600">
            Request our pitch deck or speak directly with our investor relations team to learn
            more about the opportunity.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row">
            <Button to={pitchDeckUrl} external download variant="primary" size="lg">
              <Download className="size-4" />
              Request Pitch Deck
            </Button>
            <Button to={`mailto:${contactEmail}`} external variant="secondary" size="lg">
              <Mail className="size-4" />
              Contact Investor Relations
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
