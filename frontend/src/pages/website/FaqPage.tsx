import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Seo } from '@/components/Seo'
import { faqs } from '@/data/faqs'
import { cn } from '@/lib/cn'
import { fadeUp, staggerContainer } from '@/animation/variants'

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <>
      <Seo
        title="Frequently Asked Questions"
        description="Answers for farmers, buyers, and partners about how KeepXtra works — storage, delivery, quality, coverage, and how to get started."
        path="/faq"
      />

      <section className="bg-white pt-32 pb-4">
        <Container narrow>
          <motion.div
            variants={staggerContainer(0.12)}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center gap-5 text-center"
          >
            <motion.div variants={fadeUp}>
              <Badge>FAQ</Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-balance font-display text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl"
            >
              Frequently asked questions.
            </motion.h1>
            <motion.p variants={fadeUp} className="max-w-2xl text-lg leading-relaxed text-neutral-500">
              Everything you need to know about storing, moving, and buying fresh produce with KeepXtra.
            </motion.p>
          </motion.div>
        </Container>
      </section>

      <section className="bg-white pb-24 pt-12">
        <Container narrow>
          <div className="mt-4 flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-6 text-left"
                  >
                    <span className="font-display text-lg font-medium text-neutral-900">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        'size-5 shrink-0 text-primary-600 transition-transform duration-300',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-base leading-relaxed text-neutral-500">{faq.answer}</p>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </Container>
      </section>
    </>
  )
}
