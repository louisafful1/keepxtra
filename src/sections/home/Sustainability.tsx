import { motion } from 'framer-motion'
import { Leaf, TrendingUp, Wheat, Droplets, Users2 } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { staggerContainer, fadeUp, slideRight, viewportOnce } from '@/animation/variants'

const pillars = [
  {
    icon: Leaf,
    title: 'Reduced food waste',
    description: 'Less spoilage means less pressure on land, water, and resources wasted on unsold produce.',
  },
  {
    icon: TrendingUp,
    title: 'Improved farmer income',
    description: 'Reliable storage and market access help farmers capture more of what they grow.',
  },
  {
    icon: Wheat,
    title: 'Food security',
    description: 'More produce reaching buyers means more communities reliably fed.',
  },
  {
    icon: Droplets,
    title: 'Environmental sustainability',
    description: 'Efficient logistics reduce the carbon footprint of moving food across the region.',
  },
  {
    icon: Users2,
    title: 'Community development',
    description: 'Local jobs in storage, quality control, and logistics across every market we enter.',
  },
]

export function Sustainability() {
  return (
    <section className="bg-neutral-50 py-28">
      <Container>
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={slideRight}
          >
            <ImageSlot
              src="https://images.unsplash.com/photo-1526667932380-8e555e6e5709?w=1000&q=80&auto=format&fit=crop"
              alt="Golden crop field at sunset, representing KeepXtra's sustainability impact"
              icon={Leaf}
              aspectRatio="portrait"
              rounded="3xl"
              className="lg:sticky lg:top-28"
            />
          </motion.div>

          <div className="flex flex-col gap-10">
            <motion.div
              variants={staggerContainer(0.1)}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              className="flex flex-col gap-5"
            >
              <motion.div variants={fadeUp}>
                <Badge variant="primary">Sustainability &amp; ESG</Badge>
              </motion.div>
              <motion.h2
                variants={fadeUp}
                className="text-balance font-display text-4xl font-medium leading-[1.1] text-primary-800 sm:text-5xl"
              >
                Impact that compounds beyond <span className="text-primary-500">the balance sheet.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg leading-relaxed text-neutral-500">
                Every tonne of produce we save carries forward — into farmer livelihoods, food
                security, and the environment.
              </motion.p>
            </motion.div>

            <motion.div
              variants={staggerContainer(0.08)}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              className="flex flex-col divide-y divide-neutral-200"
            >
              {pillars.map((pillar) => {
                const Icon = pillar.icon
                return (
                  <motion.div key={pillar.title} variants={fadeUp} className="flex gap-4 py-5 first:pt-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3 className="font-medium text-neutral-900">{pillar.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                        {pillar.description}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  )
}
