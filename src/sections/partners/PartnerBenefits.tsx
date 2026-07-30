import { motion } from 'framer-motion'
import { Truck, Recycle, Warehouse, Store, Package, Cpu } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

const partnerBenefits = [
  {
    icon: Truck,
    title: 'Reliable Logistics',
    description: 'A delivery network built specifically for perishable goods, on schedules you can plan around.',
  },
  {
    icon: Recycle,
    title: 'Reduced Food Waste',
    description: 'Cold storage and faster handling mean less of every harvest is lost before it sells.',
  },
  {
    icon: Warehouse,
    title: 'Guaranteed Storage',
    description: 'Dedicated cold storage capacity so your produce is protected the moment it arrives.',
  },
  {
    icon: Store,
    title: 'Market Access',
    description: 'Direct connections to buyers and sellers across our network — no informal middlemen.',
  },
  {
    icon: Package,
    title: 'Bulk Purchasing',
    description: 'Volume-based pricing and supply agreements built for high-demand operations.',
  },
  {
    icon: Cpu,
    title: 'Technology Platform',
    description: 'Real-time visibility into inventory, orders, and delivery status — all in one place.',
  },
]

export function PartnerBenefits() {
  return (
    <section className="bg-neutral-50 py-24">
      <Container>
        <SectionHeading eyebrow="Why Partner With Us" title="Built for every side of the supply chain." align="center" />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {partnerBenefits.map((benefit) => (
            <motion.div key={benefit.title} variants={fadeUp}>
              <Card className="flex h-full flex-col gap-4">
                <IconTile icon={benefit.icon} />
                <div>
                  <h3 className="font-display text-lg font-medium text-neutral-900">{benefit.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{benefit.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
