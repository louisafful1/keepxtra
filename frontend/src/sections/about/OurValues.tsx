import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { companyValues } from '@/data/companyValues'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function OurValues() {
  return (
    <section className="bg-white py-24">
      <Container>
        <SectionHeading eyebrow="Our Values" title="What we hold ourselves to." align="center" />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {companyValues.map((value) => (
            <motion.div key={value.title} variants={fadeUp}>
              <Card className="flex h-full flex-col gap-4">
                <IconTile icon={value.icon} />
                <div>
                  <h3 className="font-display text-lg font-medium text-neutral-900">{value.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{value.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
