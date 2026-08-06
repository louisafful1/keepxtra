import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import { fadeUp, slideRight, staggerContainer, viewportOnce } from '@/animation/variants'
import { ContactForm } from '@/sections/contact/ContactForm'
import { contactNumbers, mapsEmbedSrc, officeAddress } from '@/data/contactInfo'

export function ContactFormSection() {
  return (
    <section className="bg-white py-20">
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <Card hover={false} className="h-full">
              <h2 className="font-display text-2xl font-medium text-primary-800">Send us a message</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                Fill out the form and our team will respond within one business day.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </Card>
          </motion.div>

          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="flex flex-col gap-6"
          >
            <motion.div variants={slideRight} className="overflow-hidden rounded-3xl border border-neutral-200/70 shadow-soft">
              <iframe
                title="KeepXtra location"
                src={mapsEmbedSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full grayscale-[15%]"
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card hover={false} className="flex flex-col gap-4 bg-primary-50/60 border-primary-100">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-500 text-white">
                  <MessageCircle className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-display text-lg font-medium text-neutral-900">Chat with us on WhatsApp</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Prefer messaging? Both of our lines are on WhatsApp for quick questions.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {contactNumbers.map((number) => (
                    <a
                      key={number.label}
                      href={number.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:border-primary-400 hover:text-primary-700"
                    >
                      {number.label}
                      <MessageCircle className="size-4 text-primary-500" />
                    </a>
                  ))}
                </div>
              </Card>
            </motion.div>

            <p className="text-xs text-neutral-400">{officeAddress}</p>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
