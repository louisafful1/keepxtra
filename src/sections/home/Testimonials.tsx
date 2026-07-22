import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Star } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { testimonials } from '@/data/testimonials'
import { cn } from '@/lib/cn'

export function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <section className="bg-white py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Testimonials"
            title="Trusted by the people who feed a continent."
            className="mb-0"
          />
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              className="flex size-11 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
              aria-label="Previous testimonial"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              className="flex size-11 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
              aria-label="Next testimonial"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-14 overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="flex h-full flex-col gap-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-8"
                >
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'size-4',
                          i < testimonial.rating
                            ? 'fill-secondary-500 text-secondary-500'
                            : 'fill-neutral-200 text-neutral-200',
                        )}
                      />
                    ))}
                  </div>
                  <p className="flex-1 text-lg leading-relaxed text-neutral-700">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <ImageSlot
                      alt={testimonial.name}
                      aspectRatio="square"
                      rounded="2xl"
                      className="size-12 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{testimonial.name}</p>
                      <p className="text-xs text-neutral-500">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {testimonials.map((testimonial, i) => (
            <button
              key={testimonial.name}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === selectedIndex ? 'w-6 bg-primary-500' : 'w-1.5 bg-neutral-200',
              )}
            />
          ))}
        </div>
      </Container>
    </section>
  )
}
