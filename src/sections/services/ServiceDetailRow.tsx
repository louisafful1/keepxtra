import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { fadeUp, slideLeft, slideRight, staggerContainer, viewportOnce } from '@/animation/variants'
import type { ServiceDetail } from '@/data/servicesDetailed'
import { cn } from '@/lib/cn'

interface ServiceDetailRowProps {
  service: ServiceDetail
  index: number
}

export function ServiceDetailRow({ service, index }: ServiceDetailRowProps) {
  const Icon = service.icon
  const reversed = index % 2 === 1

  return (
    <section id={service.id} className={cn('py-16 sm:py-20', index % 2 === 0 ? 'bg-white' : 'bg-neutral-50')}>
      <Container>
        <div
          className={cn(
            'grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16',
            reversed && 'lg:[&>*:first-child]:order-2',
          )}
        >
          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="flex flex-col gap-5"
          >
            <motion.span
              variants={fadeUp}
              className="flex size-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-colors duration-300"
            >
              <Icon className="size-8" strokeWidth={1.75} />
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="font-display text-3xl font-medium leading-tight text-primary-800"
            >
              {service.title}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg leading-relaxed text-neutral-600">
              {service.description}
            </motion.p>
            <motion.ul variants={fadeUp} className="flex flex-col gap-2.5 pt-2">
              {service.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-neutral-700">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <Check className="size-3" strokeWidth={2.5} />
                  </span>
                  {benefit}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.div
            variants={reversed ? slideLeft : slideRight}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <ImageSlot alt={`${service.title} illustration`} label={service.title} icon={Icon} aspectRatio="video" />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
