import { motion } from 'framer-motion'
import { Recycle, TrendingUp, Truck, ShieldCheck } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

const missionPoints = [
  {
    icon: Recycle,
    title: 'Reduce food waste',
    description: 'Cut post-harvest loss with proper cold storage and faster handling.',
  },
  {
    icon: TrendingUp,
    title: 'Increase farmer income',
    description: 'Protect the value of every harvest so less of it is lost to spoilage.',
  },
  {
    icon: Truck,
    title: 'Create reliable food distribution',
    description: 'Give buyers a consistent, dependable supply they can plan around.',
  },
  {
    icon: ShieldCheck,
    title: 'Improve food security',
    description: "Keep more of what's grown reaching the people who need it.",
  },
]

export function MissionSection() {
  return (
    <section className="bg-neutral-50 py-24">
      <Container>
        <SectionHeading eyebrow="Our Mission" title="Why we get up every day." align="center" />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {missionPoints.map((point) => (
            <motion.div key={point.title} variants={fadeUp}>
              <Card className="flex h-full flex-col gap-4">
                <IconTile icon={point.icon} />
                <div>
                  <h3 className="font-display text-lg font-medium text-neutral-900">{point.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{point.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
