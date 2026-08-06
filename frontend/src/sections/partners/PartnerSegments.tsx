import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { partnerSegments } from '@/data/partnerSegments'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function PartnerSegments() {
  return (
    <section className="bg-white py-24">
      <Container>
        <SectionHeading
          eyebrow="Who We Work With"
          title="Every point of the food ecosystem."
          description="Wherever fresh produce moves, KeepXtra plugs in — with infrastructure and support built for your specific business."
          align="center"
        />

        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {partnerSegments.map((segment) => {
            const Icon = segment.icon
            return (
              <motion.div
                key={segment.title}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="group flex flex-col overflow-hidden rounded-3xl border border-neutral-200/70 bg-white shadow-soft transition-shadow duration-300 hover:shadow-premium"
              >
                <div className="overflow-hidden">
                  <div className="transition-transform duration-500 group-hover:scale-105">
                    <ImageSlot
                      src={segment.image}
                      alt={segment.title}
                      icon={Icon}
                      aspectRatio="video"
                      rounded="3xl"
                      className="rounded-b-none border-none"
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-7">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="font-display text-lg font-medium text-neutral-900">{segment.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-500">{segment.description}</p>
                  <ul className="mt-1 flex flex-col gap-2">
                    {segment.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-sm text-neutral-700">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-primary-500" strokeWidth={2.5} />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
