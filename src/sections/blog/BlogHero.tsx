import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { fadeUp, staggerContainer } from '@/animation/variants'

export function BlogHero() {
  return (
    <section className="bg-neutral-50 pb-16 pt-36 sm:pt-40">
      <Container>
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge>KeepXtra Journal</Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-balance font-display text-4xl font-medium leading-[1.1] text-primary-800 sm:text-5xl"
          >
            Insights shaping the <span className="text-primary-500">future of agriculture.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="max-w-xl text-balance text-lg leading-relaxed text-neutral-500">
            Stories and ideas on post-harvest loss, cold chain logistics, and building
            resilient food systems across Africa.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  )
}
