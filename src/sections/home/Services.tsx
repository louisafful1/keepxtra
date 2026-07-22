import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { IconTile } from '@/components/ui/IconTile'
import { Card } from '@/components/ui/Card'
import { services } from '@/data/services'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function Services() {
  return (
    <section className="bg-neutral-50 py-28">
      <Container>
        <SectionHeading
          eyebrow="What We Do"
          title="End-to-end infrastructure for fresh produce."
          description="Every layer a food supply chain needs — built, operated, and optimized by KeepXtra."
        />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service) => {
            const Icon = service.icon
            return (
              <motion.div key={service.title} variants={fadeUp} className="group">
                <Card className="flex h-full flex-col gap-5">
                  <IconTile icon={Icon} />
                  <h3 className="font-display text-xl font-medium text-neutral-900">
                    {service.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-500">
                    {service.description}
                  </p>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
