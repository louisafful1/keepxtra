import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { businessModelStreams } from '@/data/businessModel'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function BusinessModelSection() {
  return (
    <section className="bg-neutral-50 py-24">
      <Container>
        <SectionHeading eyebrow="Business Model" title="Five ways we generate revenue." align="center" />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5"
        >
          {businessModelStreams.map((stream) => (
            <motion.div key={stream.title} variants={fadeUp}>
              <Card className="flex h-full flex-col gap-4">
                <IconTile icon={stream.icon} />
                <div>
                  <h3 className="font-display text-lg font-medium text-neutral-900">{stream.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{stream.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
