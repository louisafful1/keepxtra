import { Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { GradientBlob } from '@/components/ui/GradientBlob'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { fadeUp, slideRight, staggerContainer } from '@/animation/variants'

export function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero pb-20 pt-36 sm:pt-40">
      <GradientBlob color="primary" size="xl" className="-left-40 -top-40" />
      <GradientBlob color="secondary" size="lg" className="-right-32 top-1/3" animate={false} />

      <Container className="relative grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-12">
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6"
        >
          <motion.div variants={fadeUp}>
            <Badge>About KeepXtra</Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-balance font-display text-4xl font-bold leading-[1.06] tracking-[-0.02em] text-neutral-900 sm:text-5xl lg:text-[3.25rem]"
          >
            We&apos;re building what fresh produce needs to{' '}
            <span className="text-primary-700">survive the journey.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="max-w-lg text-lg leading-relaxed text-neutral-600">
            Every year, millions of tonnes of food are lost across Africa before they ever
            reach a buyer — not from a shortage of harvests, but from a shortage of
            infrastructure. Poor storage and fragmented logistics turn abundance into waste.
            KeepXtra exists to close that gap.
          </motion.p>
        </motion.div>

        <motion.div variants={slideRight} initial="hidden" animate="show">
          <ImageSlot
            src="/images/segments/farmers.jpg"
            alt="Partner farmers bagging harvested produce in northern Ghana"
            label="Farmers & Fresh Produce"
            icon={Users}
            aspectRatio="video"
            rounded="3xl"
          />
        </motion.div>
      </Container>
    </section>
  )
}
