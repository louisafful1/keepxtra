import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { segments } from '@/data/whoWeServe'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function WhoWeServe() {
  return (
    <section className="bg-white py-28">
      <Container>
        <SectionHeading
          eyebrow="Who We Serve"
          title="One network, every point of the food chain."
          description="From the farm gate to the family table, KeepXtra connects everyone who grows, sells, or serves fresh produce."
        />

        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-16 grid grid-cols-2 gap-5 sm:grid-cols-4"
        >
          {segments.map((segment) => (
            <motion.div key={segment.title} variants={fadeUp} className="group flex flex-col gap-4">
              <ImageSlot
                src={segment.image}
                alt={segment.title}
                icon={segment.icon}
                aspectRatio="square"
                rounded="2xl"
                className="transition-transform duration-500 group-hover:-translate-y-1"
              />
              <p className="text-center text-sm font-medium text-neutral-700">{segment.title}</p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
