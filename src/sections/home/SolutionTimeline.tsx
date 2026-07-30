import { useEffect, useRef } from 'react'
import { gsap } from '@/animation/gsapConfig'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { solutionSteps } from '@/data/solutionSteps'
import { Container } from '@/components/ui/Container'
import { ScrollRevealWrapper } from '@/animation/ScrollRevealWrapper'
import { staggerContainer } from '@/animation/variants'
import { motion } from 'framer-motion'

function StepCard({
  step,
  index,
  cardRef,
  className,
}: {
  step: (typeof solutionSteps)[number]
  index: number
  cardRef?: (el: HTMLDivElement | null) => void
  className?: string
}) {
  const Icon = step.icon
  return (
    <div
      ref={cardRef}
      data-step-card
      className={
        className ??
        'solution-card surface-card flex w-[78vw] shrink-0 flex-col justify-between rounded-3xl p-8 transition-all duration-500 sm:w-[420px]'
      }
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-medium text-neutral-300">{step.index}</span>
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-colors duration-500">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
      </div>
      <div className="mt-10 flex flex-col gap-3">
        <h3 className="font-display text-2xl font-medium text-neutral-900">{step.title}</h3>
        <p className="text-sm leading-relaxed text-neutral-500">{step.description}</p>
      </div>
      {index < solutionSteps.length - 1 && (
        <div className="mt-8 h-px w-full bg-gradient-to-r from-primary-300 to-transparent" />
      )}
    </div>
  )
}

export function SolutionTimeline() {
  const reduced = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const skipScrollJack = reduced || isMobile
  const containerRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (skipScrollJack || !containerRef.current || !trackRef.current) return

    const ctx = gsap.context(() => {
      const track = trackRef.current!

      const setup = () => {
        const scrollDistance = Math.max(track.scrollWidth - window.innerWidth, 0)
        if (scrollDistance <= 0) return

        gsap.to(track, {
          x: -scrollDistance,
          ease: 'none',
          scrollTrigger: {
            id: 'solution-timeline',
            trigger: containerRef.current,
            start: 'top top',
            end: () => `+=${scrollDistance}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const activeIndex = Math.min(
                solutionSteps.length - 1,
                Math.floor(self.progress * solutionSteps.length),
              )
              cardRefs.current.forEach((card, i) => {
                card?.classList.toggle('is-active', i === activeIndex)
              })
              if (progressRef.current) {
                progressRef.current.style.width = `${self.progress * 100}%`
              }
            },
          },
        })
      }

      setup()
    }, containerRef)

    return () => ctx.revert()
  }, [skipScrollJack])

  if (reduced) {
    return (
      <section className="bg-neutral-50 py-28">
        <Container>
          <ScrollRevealWrapper>
            <p className="text-xs font-medium uppercase tracking-widest text-primary-600">
              Our Solution
            </p>
            <h2 className="mt-4 max-w-2xl text-balance font-display text-3xl font-medium leading-tight text-primary-800 sm:text-4xl">
              From farm to table, every step is <span className="text-primary-500">engineered.</span>
            </h2>
            <p className="mt-4 max-w-xl text-lg text-neutral-500">
              A single connected process replaces fragmented, informal supply chains.
            </p>
          </ScrollRevealWrapper>
          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-10%' }}
            className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {solutionSteps.map((step, i) => (
              <StepCard
                key={step.title}
                step={step}
                index={i}
                className="surface-card flex flex-col justify-between rounded-3xl p-8"
              />
            ))}
          </motion.div>
        </Container>
      </section>
    )
  }

  if (isMobile) {
    return (
      <section className="bg-neutral-50 py-20">
        <Container>
          <ScrollRevealWrapper>
            <p className="text-xs font-medium uppercase tracking-widest text-primary-600">
              Our Solution
            </p>
            <h2 className="mt-4 max-w-2xl text-balance font-display text-3xl font-medium leading-tight text-primary-800">
              One connected process, from harvest to <span className="text-primary-500">doorstep.</span>
            </h2>
          </ScrollRevealWrapper>
        </Container>

        <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4">
          {solutionSteps.map((step, i) => (
            <StepCard
              key={step.title}
              step={step}
              index={i}
              className="solution-card surface-card flex w-[78vw] shrink-0 snap-start flex-col justify-between rounded-3xl p-8 transition-all duration-500"
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section ref={containerRef} className="relative bg-neutral-50">
      <div className="flex h-screen flex-col justify-center overflow-hidden py-16">
        <Container className="shrink-0">
          <ScrollRevealWrapper>
            <p className="text-xs font-medium uppercase tracking-widest text-primary-600">
              Our Solution
            </p>
            <h2 className="mt-4 max-w-2xl text-balance font-display text-3xl font-medium leading-tight text-primary-800 sm:text-4xl">
              One connected process, from harvest to <span className="text-primary-500">doorstep.</span>
            </h2>
          </ScrollRevealWrapper>

          <div className="mt-8 h-1 w-full max-w-md overflow-hidden rounded-full bg-neutral-200">
            <div ref={progressRef} className="h-full w-0 rounded-full bg-primary-600" />
          </div>
        </Container>

        <div className="relative mt-12 w-full">
          <div ref={trackRef} className="flex gap-6 px-6 will-change-transform sm:px-[10vw]">
            {solutionSteps.map((step, i) => (
              <StepCard
                key={step.title}
                step={step}
                index={i}
                cardRef={(el) => {
                  cardRefs.current[i] = el
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
