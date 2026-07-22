import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

const comparisons = [
  {
    label: 'Handling',
    traditional: 'Informal, inconsistent handling',
    keepxtra: 'Professional, standardized handling',
  },
  {
    label: 'Storage',
    traditional: 'Little to no cold storage',
    keepxtra: 'Temperature-controlled facilities',
  },
  {
    label: 'Speed',
    traditional: 'Slow, multi-layered distribution',
    keepxtra: 'Fast, direct-to-buyer logistics',
  },
  {
    label: 'Waste',
    traditional: 'High post-harvest loss',
    keepxtra: 'Significantly lower waste',
  },
  {
    label: 'Reliability',
    traditional: 'Unpredictable supply',
    keepxtra: 'Reliable, trackable inventory',
  },
  {
    label: 'Pricing',
    traditional: 'Volatile, middleman-driven pricing',
    keepxtra: 'Fairer prices for farmers & buyers',
  },
]

export function WhyKeepXtra() {
  return (
    <section className="bg-neutral-50 py-28">
      <Container>
        <SectionHeading
          eyebrow="Why KeepXtra"
          title="A fundamentally better supply chain."
          description="We replace guesswork and spoilage with infrastructure, data, and accountability."
        />

        <motion.div
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-16 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-soft"
        >
          <div className="grid grid-cols-1 divide-y divide-neutral-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col gap-1 p-8 sm:p-10">
              <p className="mb-4 text-sm font-medium uppercase tracking-widest text-neutral-400">
                Traditional Supply Chain
              </p>
              {comparisons.map((row) => (
                <motion.div
                  key={row.label}
                  variants={fadeUp}
                  className="flex items-start gap-3 border-t border-neutral-100 py-4 first:border-t-0"
                >
                  <X className="mt-0.5 size-4 shrink-0 text-neutral-300" strokeWidth={2} />
                  <p className="text-sm text-neutral-500">{row.traditional}</p>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col gap-1 bg-primary-500/[0.03] p-8 sm:p-10">
              <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary-600">
                KeepXtra
              </p>
              {comparisons.map((row) => (
                <motion.div
                  key={row.label}
                  variants={fadeUp}
                  className="flex items-start gap-3 border-t border-primary-100 py-4 first:border-t-0"
                >
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <p className="text-sm font-medium text-neutral-800">{row.keepxtra}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
