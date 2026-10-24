import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, MessageCircle, ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'
import { contactEmail, ordersEmail, contactNumbers, officeAddress, mapsHref, workingHours } from '@/data/contactInfo'

export function ContactInfoGrid() {
  return (
    <section className="bg-neutral-50 pb-20">
      <Container>
        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={fadeUp}>
            <Card className="group flex h-full flex-col gap-4">
              <IconTile icon={Mail} />
              <div>
                <p className="text-sm font-medium text-neutral-400">Email</p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="mt-1 block break-words font-display text-lg font-medium text-neutral-900 transition-colors hover:text-primary-600"
                >
                  {contactEmail}
                </a>
                <p className="mt-1 text-xs text-neutral-500">General enquiries and partnerships</p>
                <a
                  href={`mailto:${ordersEmail}`}
                  className="mt-3 block break-words font-display text-lg font-medium text-neutral-900 transition-colors hover:text-primary-600"
                >
                  {ordersEmail}
                </a>
                <p className="mt-1 text-xs text-neutral-500">Questions about an XtraStore order</p>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="group flex h-full flex-col gap-4">
              <IconTile icon={Phone} />
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-neutral-400">Call or WhatsApp</p>
                {contactNumbers.map((number) => (
                  <div key={number.label} className="flex items-center justify-between gap-3">
                    <a
                      href={number.tel}
                      className="font-display text-lg font-medium text-neutral-900 transition-colors hover:text-primary-600"
                    >
                      {number.label}
                    </a>
                    <a
                      href={number.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Chat on WhatsApp: ${number.label}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-colors hover:bg-primary-500 hover:text-white"
                    >
                      <MessageCircle className="size-4" strokeWidth={1.75} />
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="group flex h-full flex-col gap-4">
              <IconTile icon={MapPin} />
              <div>
                <p className="text-sm font-medium text-neutral-400">Location</p>
                <p className="mt-1 text-lg font-medium leading-snug text-neutral-900">{officeAddress}</p>
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
                >
                  Get directions
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="group flex h-full flex-col gap-4">
              <IconTile icon={Clock} />
              <div>
                <p className="text-sm font-medium text-neutral-400">Working Hours</p>
                <p className="mt-1 text-lg font-medium leading-snug text-neutral-900">{workingHours}</p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
