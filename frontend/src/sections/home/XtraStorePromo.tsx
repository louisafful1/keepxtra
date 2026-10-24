import { motion } from 'framer-motion'
import { ShoppingBasket, PhoneCall, Truck } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { XtraStoreMockup } from '@/components/ui/XtraStoreMockup'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'
import { storeName, storeUrl } from '@/data/storeInfo'

const highlights = [
  {
    icon: ShoppingBasket,
    title: 'Retail or bulk',
    copy: 'A single crate for the kitchen, or wholesale quantities for a restaurant, hotel or store.',
  },
  {
    icon: PhoneCall,
    title: 'Confirmed with you',
    copy: 'Our team reviews every order and confirms stock, delivery and payment with a call.',
  },
  {
    icon: Truck,
    title: 'Delivery arranged',
    copy: 'We agree the delivery slot and fee with you before dispatch.',
  },
]

export function XtraStorePromo() {
  return (
    <section className="bg-white py-28">
      <Container>
        <div className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-soft">
          <div className="grid lg:grid-cols-[0.92fr_1.18fr] lg:items-stretch">
            <motion.div
              variants={staggerContainer(0.08)}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              className="flex flex-col gap-6 px-8 py-12 sm:px-12 lg:px-14 lg:py-16"
            >
              <motion.p
                variants={fadeUp}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-600"
              >
                {storeName} — our online store
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="text-balance text-4xl font-bold leading-[1.08] tracking-[-0.02em] text-neutral-900 sm:text-5xl"
              >
                Order KeepXtra produce <span className="text-primary-500">online.</span>
              </motion.h2>

              <motion.p variants={fadeUp} className="max-w-xl text-lg leading-relaxed text-neutral-500">
                {storeName} is where our produce meets your kitchen or business. Browse the
                current range, see live prices and availability, and place an order in a couple
                of minutes.
              </motion.p>

              <motion.ul variants={fadeUp} className="mt-2 flex flex-col gap-4">
                {highlights.map(({ icon: Icon, title, copy }) => (
                  <li key={title} className="flex items-start gap-3.5">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-600">
                      <Icon className="size-[18px]" strokeWidth={1.75} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-neutral-900">{title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-neutral-500">
                        {copy}
                      </span>
                    </span>
                  </li>
                ))}
              </motion.ul>

              <motion.div variants={fadeUp} className="mt-2 flex flex-wrap items-center gap-3">
                <Button to={storeUrl} external variant="primary" size="lg" icon>
                  Shop on {storeName}
                </Button>
                <Button to="/contact" variant="secondary" size="lg">
                  Talk to our team
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col justify-center border-t border-neutral-200 bg-gradient-hero px-5 py-12 sm:px-8 lg:border-l lg:border-t-0 lg:px-6 lg:py-12"
            >
              <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                The {storeName} storefront on mobile
              </p>
              <XtraStoreMockup />
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  )
}
