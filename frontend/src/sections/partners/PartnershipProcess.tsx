import { motion } from 'framer-motion'
import { FileText, Users, Handshake, Rocket } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

const processSteps = [
  {
    icon: FileText,
    title: 'Apply',
    description: 'Tell us about your business and how you fit into the food supply chain.',
  },
  {
    icon: Users,
    title: 'Meet Our Team',
    description: 'A short call to understand your needs and how KeepXtra can support you.',
  },
  {
    icon: Handshake,
    title: 'Onboarding',
    description: 'We set up storage, delivery schedules, and system access tailored to you.',
  },
  {
    icon: Rocket,
    title: 'Start Receiving Value',
    description: 'Reliable storage, logistics, and market access — from day one.',
  },
]

export function PartnershipProcess() {
  return (
    <section id="process" className="bg-white py-24">
      <Container>
        <SectionHeading eyebrow="How It Works" title="From application to partnership." align="center" />

        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent lg:block"
          />

          {processSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div key={step.title} variants={fadeUp} className="relative flex flex-col items-center gap-4 text-center">
                <span className="relative z-10 flex size-12 items-center justify-center rounded-full border-2 border-primary-500 bg-white text-primary-600 shadow-soft">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <p className="text-xs font-medium uppercase tracking-widest text-primary-500">
                  Step {index + 1}
                </p>
                <h3 className="font-display text-lg font-medium text-neutral-900">{step.title}</h3>
                <p className="max-w-[16rem] text-sm leading-relaxed text-neutral-500">{step.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
