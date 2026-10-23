import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { problemChallenges, problemStat } from '@/data/problemMetrics'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function ProblemCharts() {
  return (
    <section className="bg-white py-24">
      <Container>
        <SectionHeading
          eyebrow="The Problem"
          title="A market held back by broken infrastructure."
          description="The structural problems holding back fresh-produce logistics in Africa."
          align="center"
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 flex flex-col items-center gap-2 text-center"
        >
          <p className="font-display text-5xl font-bold leading-none text-primary-700 sm:text-6xl">
            {problemStat.value}
          </p>
          <p className="max-w-xl text-base leading-relaxed text-neutral-600">{problemStat.label}</p>
          <p className="text-xs text-neutral-400">Source: {problemStat.source}</p>
        </motion.div>

        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {problemChallenges.map((challenge) => (
            <motion.div key={challenge.title} variants={fadeUp} className="h-full">
              <Card hover={false} className="flex h-full flex-col gap-3">
                <h3 className="font-display text-lg font-medium text-neutral-900">
                  {challenge.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-500">{challenge.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
