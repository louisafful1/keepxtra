import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { marketOpportunity } from '@/data/marketOpportunity'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

function buildTrendPaths(trend: number[]) {
  const max = Math.max(...trend)
  const min = Math.min(...trend)
  const range = max - min || 1
  const stepX = 100 / (trend.length - 1)

  const points = trend.map((value, i) => {
    const x = i * stepX
    const y = 34 - ((value - min) / range) * 28
    return [x, y] as const
  })

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const areaPath = `${linePath} L100,36 L0,36 Z`
  const [lastX, lastY] = points[points.length - 1]

  return { linePath, areaPath, lastX, lastY }
}

export function MarketOpportunity() {
  return (
    <section className="bg-white py-24">
      <Container>
        <SectionHeading
          eyebrow="Market Opportunity"
          title="A market growing faster than infrastructure can keep up."
          align="center"
        />

        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {marketOpportunity.map((metric) => {
            const trend = metric.trend ? buildTrendPaths(metric.trend) : null
            return (
              <motion.div key={metric.label} variants={fadeUp}>
                <Card hover={false} className="flex flex-col gap-1">
                  <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                    {metric.label}
                  </p>
                  {metric.value && (
                    <p className="font-display text-3xl font-medium text-primary-800">{metric.value}</p>
                  )}
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">{metric.description}</p>
                  {metric.source && (
                    <p className="mt-1 text-xs text-neutral-400">Source: {metric.source}</p>
                  )}
                  {trend && (
                    <svg viewBox="0 0 100 40" className="mt-4 h-16 w-full text-primary-500" aria-hidden>
                      <path d={trend.areaPath} fill="currentColor" className="opacity-10" />
                      <path
                        d={trend.linePath}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <circle cx={trend.lastX} cy={trend.lastY} r={3} fill="currentColor" stroke="white" strokeWidth={2} />
                    </svg>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
