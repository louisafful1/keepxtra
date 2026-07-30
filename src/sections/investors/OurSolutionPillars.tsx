import { motion } from 'framer-motion'
import { Cpu, Warehouse, Truck, Workflow, Store } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

const solutionPillars = [
  {
    icon: Cpu,
    title: 'Technology',
    description: 'A software layer giving real-time visibility into inventory, orders, and routing.',
  },
  {
    icon: Warehouse,
    title: 'Storage',
    description: 'Temperature-controlled facilities that extend shelf life from the point of harvest.',
  },
  {
    icon: Truck,
    title: 'Distribution',
    description: 'A logistics network built specifically for perishable goods, at scale.',
  },
  {
    icon: Workflow,
    title: 'Supply Chain',
    description: 'One connected process from farm to storage to buyer — instead of fragmented steps.',
  },
  {
    icon: Store,
    title: 'Market Access',
    description: 'Direct connections between producers and buyers, cutting out inefficient middle layers.',
  },
]

export function OurSolutionPillars() {
  return (
    <section className="bg-neutral-50 py-24">
      <Container>
        <SectionHeading eyebrow="Our Solution" title="The infrastructure layer that was missing." align="center" />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5"
        >
          {solutionPillars.map((pillar) => (
            <motion.div key={pillar.title} variants={fadeUp}>
              <Card className="flex h-full flex-col gap-4">
                <IconTile icon={pillar.icon} />
                <div>
                  <h3 className="font-display text-lg font-medium text-neutral-900">{pillar.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{pillar.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
