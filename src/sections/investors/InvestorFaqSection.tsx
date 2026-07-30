import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { investorFaqs } from '@/data/investorFaqs'
import { cn } from '@/lib/cn'

export function InvestorFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="bg-white py-24">
      <Container narrow>
        <SectionHeading eyebrow="Investor FAQ" title="Common questions from investors." align="center" />

        <div className="mt-14 flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
          {investorFaqs.map((faq, index) => {
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
  )
}
