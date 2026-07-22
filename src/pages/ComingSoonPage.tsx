import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { fadeUp } from '@/animation/variants'
import { buildSeo } from '@/lib/seo'

interface ComingSoonPageProps {
  title: string
  description: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  const seo = buildSeo({ title, description })

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <section className="flex min-h-[70vh] items-center bg-neutral-50 pt-32">
        <Container>
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="flex max-w-2xl flex-col gap-6"
          >
            <Badge variant="secondary">Coming Soon</Badge>
            <h1 className="text-balance font-display text-5xl font-medium tracking-tight text-neutral-900 sm:text-6xl">
              {title}
            </h1>
            <p className="text-lg leading-relaxed text-neutral-500">{description}</p>
            <div className="flex gap-3 pt-4">
              <Button to="/">Back to Home</Button>
              <Button to="/contact" variant="secondary">
                Contact Us
              </Button>
            </div>
          </motion.div>
        </Container>
      </section>
    </>
  )
}
