import { useEffect, useRef } from 'react'
import { ArrowDown, Snowflake, TrendingUp } from 'lucide-react'
import { gsap } from '@/animation/gsapConfig'
import { prefersReducedMotion } from '@/hooks/useReducedMotion'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { GradientBlob } from '@/components/ui/GradientBlob'
import { ImageSlot } from '@/components/ui/ImageSlot'

export function Hero() {
  const scopeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const reduced = prefersReducedMotion()
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (reduced) {
        gsap.set(
          ['.hero-badge', '.hero-line', '.hero-sub', '.hero-cta', '.hero-image', '.hero-card', '.hero-scroll-hint'],
          { opacity: 1, y: 0, scale: 1 },
        )
        return
      }

      gsap.set('.hero-line', { yPercent: 110 })
      gsap.set(['.hero-badge', '.hero-sub', '.hero-cta', '.hero-scroll-hint'], { opacity: 0, y: 16 })
      gsap.set('.hero-image', { opacity: 0, scale: 0.94, y: 24 })
      gsap.set('.hero-card', { opacity: 0, scale: 0.85, y: 20 })

      tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.6 })
        .to('.hero-line', { yPercent: 0, duration: 0.9, stagger: 0.1 }, '-=0.3')
        .to('.hero-sub', { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
        .to('.hero-cta', { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
        .to('.hero-image', { opacity: 1, scale: 1, y: 0, duration: 1 }, '-=0.7')
        .to('.hero-card', { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.15 }, '-=0.6')
        .to('.hero-scroll-hint', { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
    }, scopeRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={scopeRef}
      className="relative flex min-h-screen items-center overflow-hidden bg-gradient-hero pt-28 pb-16"
    >
      <GradientBlob color="primary" size="xl" className="-left-40 -top-40" />
      <GradientBlob color="secondary" size="lg" className="-right-32 top-1/3" animate={false} />

      <Container className="relative grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-7">
          <div className="hero-badge">
            <Badge>Post-Harvest Logistics Infrastructure</Badge>
          </div>

          <h1 className="text-balance font-display text-5xl font-medium leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl lg:text-[4rem]">
            <span className="block overflow-hidden">
              <span className="hero-line block">Reducing Food Waste.</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-line block text-gradient-brand">Powering Africa&apos;s</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-line block">Fresh Produce Supply Chain.</span>
            </span>
          </h1>

          <p className="hero-sub max-w-lg text-lg leading-relaxed text-neutral-500">
            KeepXtra connects farmers and traders to professional cold storage, quality
            assurance, and last-mile delivery — so fresh produce reaches restaurants,
            retailers, and households before it ever has the chance to spoil.
          </p>

          <div className="hero-cta flex flex-col gap-4 pt-2 sm:flex-row">
            <Button to="/partners" size="lg" icon>
              Become a Partner
            </Button>
            <Button to="/contact" variant="secondary" size="lg">
              Request a Delivery
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="hero-image">
            <ImageSlot
              src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80&auto=format&fit=crop"
              alt="KeepXtra cold storage and logistics warehouse"
              icon={Snowflake}
              aspectRatio="square"
              rounded="3xl"
            />
          </div>

          <div className="hero-card surface-card absolute -left-6 top-10 hidden w-52 flex-col gap-1 rounded-2xl p-4 sm:flex">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary-500/10 text-primary-600">
                <Snowflake className="size-4" />
              </span>
              <span className="text-xs font-medium text-neutral-500">Cold Chain</span>
            </div>
            <p className="font-display text-2xl font-semibold text-neutral-900">-2°C</p>
            <p className="text-xs text-neutral-400">Maintained across storage</p>
          </div>

          <div className="hero-card surface-card absolute -right-6 bottom-10 hidden w-52 flex-col gap-1 rounded-2xl p-4 sm:flex">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
                <TrendingUp className="size-4" />
              </span>
              <span className="text-xs font-medium text-neutral-500">Waste Reduced</span>
            </div>
            <p className="font-display text-2xl font-semibold text-neutral-900">68%</p>
            <p className="text-xs text-neutral-400">Across partner farms</p>
          </div>
        </div>
      </Container>

      <div className="hero-scroll-hint absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 text-neutral-400">
        <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
        <ArrowDown className="size-4 animate-bounce" />
      </div>
    </section>
  )
}
