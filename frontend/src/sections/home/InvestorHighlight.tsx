import { motion } from 'framer-motion'
import { Globe2, LineChart, Repeat, Cpu } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GradientBlob } from '@/components/ui/GradientBlob'
import { staggerContainer, fadeUp, viewportOnce, EASE_OUT } from '@/animation/variants'

const pillars = [
  {
    icon: Globe2,
    title: 'Massive market opportunity',
    description: 'Billions lost annually to post-harvest loss across African food systems.',
  },
  {
    icon: Cpu,
    title: 'Technology-enabled operations',
    description: 'Inventory, quality, and logistics run on a single connected data layer.',
  },
  {
    icon: LineChart,
    title: 'Scalable logistics model',
    description: 'A storage-and-delivery playbook designed to replicate city by city.',
  },
  {
    icon: Repeat,
    title: 'Recurring revenue',
    description: 'Long-term supply contracts with restaurants, retailers, and institutions.',
  },
]

const chartPath =
  'M0 150 C 60 140, 90 120, 140 110 C 190 100, 220 60, 280 55 C 340 50, 370 20, 430 10'

export function InvestorHighlight() {
  return (
    <section className="relative overflow-hidden bg-white py-28">
      <GradientBlob color="mixed" size="lg" className="-right-40 top-0" animate={false} />
      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <motion.div
            variants={staggerContainer(0.12)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="secondary">For Investors</Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-balance font-display text-4xl font-medium leading-[1.1] text-primary-800 sm:text-5xl"
            >
              Building the infrastructure layer for Africa&apos;s{' '}
              <span className="text-primary-500">food economy.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="max-w-lg text-lg leading-relaxed text-neutral-500">
              KeepXtra sits at the intersection of logistics, food security, and technology —
              a category-defining opportunity with a clear path to national and regional
              expansion.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button to="/investors" variant="secondary" icon>
                Explore Investor Relations
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className="relative rounded-3xl border border-neutral-200 bg-white p-8 shadow-premium"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                  Projected Volume Handled
                </p>
                <p className="mt-2 font-display text-3xl font-medium text-neutral-900">
                  Year-over-year growth
                </p>
              </div>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
                +CAGR
              </span>
            </div>

            <svg viewBox="0 0 430 160" fill="none" className="mt-8 w-full">
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                d={`${chartPath} L 430 160 L 0 160 Z`}
                fill="url(#chartFill)"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={viewportOnce}
                transition={{ duration: 1, delay: 0.4 }}
              />
              <motion.path
                d={chartPath}
                stroke="#16A34A"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={viewportOnce}
                transition={{ duration: 1.4, ease: EASE_OUT }}
              />
              {[0, 140, 280, 430].map((x, i) => (
                <motion.circle
                  key={x}
                  cx={x}
                  cy={[150, 110, 55, 10][i]}
                  r={4}
                  fill="#FFFFFF"
                  stroke="#16A34A"
                  strokeWidth={2}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.2 }}
                />
              ))}
            </svg>

            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-neutral-200 pt-6">
              <div>
                <p className="font-display text-xl font-medium text-neutral-900">54</p>
                <p className="text-xs text-neutral-500">Markets across Africa</p>
              </div>
              <div>
                <p className="font-display text-xl font-medium text-neutral-900">$300B+</p>
                <p className="text-xs text-neutral-500">Continental food market</p>
              </div>
              <div>
                <p className="font-display text-xl font-medium text-neutral-900">1</p>
                <p className="text-xs text-neutral-500">Connected platform</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <motion.div
                key={pillar.title}
                variants={fadeUp}
                className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-6"
              >
                <Icon className="size-5 text-primary-600" strokeWidth={1.75} />
                <h3 className="font-display text-base font-medium text-neutral-900">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-500">{pillar.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
