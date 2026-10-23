import { motion } from 'framer-motion'
import { Check, Snowflake, TriangleAlert, X } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

const failures = [
  'Massive post-harvest financial loss for farmers',
  'Unpredictable supply for hotels & restaurants',
  'Higher prices for households due to waste',
]

const wins = [
  'Income retained directly in farmer pockets',
  'Guaranteed freshness and strict quality grading',
  'End-to-end telemetry and predictable delivery',
]

export function ProblemStats() {
  return (
    <section className="bg-white py-24 sm:py-28">
      <Container>
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center"
        >
          <motion.p
            variants={fadeUp}
            className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-600"
          >
            The Mission
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.02em] text-neutral-900 sm:text-5xl"
          >
            The infrastructure Africa&apos;s food system was missing.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="max-w-2xl text-lg leading-relaxed text-neutral-500"
          >
            Across Ghana and much of Africa, harvests are abundant — but the systems to move
            them safely from farm to table haven&apos;t kept pace.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer(0.14)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <motion.div
            variants={fadeUp}
            className="flex flex-col gap-6 rounded-2xl border border-[#F3DADA] bg-[#FDF6F6] p-8 sm:p-10"
          >
            <span className="flex size-14 items-center justify-center rounded-xl bg-[#FBE4E4] text-[#DC2626]">
              <TriangleAlert className="size-6" strokeWidth={2} />
            </span>
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
                The Broken Status Quo
              </h3>
              <p className="leading-relaxed text-neutral-500">
                Produce travels for hours in open un-refrigerated trucks, sits in hot
                open-air markets, and passes through multiple informal middlemen — so a
                significant share spoils before it ever reaches a buyer. FAO estimates
                around 23% of food is lost in sub-Saharan Africa before retail.
              </p>
            </div>
            <ul className="flex flex-col gap-3.5">
              {failures.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm font-medium text-[#B91C1C]"
                >
                  <X className="mt-0.5 size-4 shrink-0" strokeWidth={2.75} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex flex-col gap-6 rounded-2xl border border-[#DBEFE3] bg-[#F4FAF6] p-8 sm:p-10"
          >
            <span className="flex size-14 items-center justify-center rounded-xl bg-primary-700 text-white">
              <Snowflake className="size-6" strokeWidth={2} />
            </span>
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
                The KeepXtra Solution
              </h3>
              <p className="leading-relaxed text-neutral-500">
                Physical cold-chain infrastructure built specifically for perishable goods:
                temperature-controlled solar cold rooms, quality inspection, and optimized
                reefer logistics.
              </p>
            </div>
            <ul className="flex flex-col gap-3.5">
              {wins.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm font-medium text-primary-700"
                >
                  <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.75} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
