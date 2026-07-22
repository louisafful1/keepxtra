import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Marquee } from '@/components/ui/Marquee'
import { LogoMark } from '@/components/ui/LogoMark'
import { trustLogos } from '@/data/trustLogos'
import { fadeUp, viewportOnce } from '@/animation/variants'

export function TrustBar() {
  return (
    <section className="border-y border-neutral-200/70 bg-white py-12">
      <Container>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-neutral-400"
        >
          Trusted by restaurants, hotels, retailers, farmers &amp; food businesses
        </motion.p>
      </Container>
      <Marquee>
        {trustLogos.map((logo) => (
          <LogoMark key={logo.name} name={logo.name} />
        ))}
      </Marquee>
    </section>
  )
}
