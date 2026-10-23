import { useEffect, useRef } from 'react'
import { Check, Droplets, PackageCheck, Truck } from 'lucide-react'
import { gsap } from '@/animation/gsapConfig'
import { prefersReducedMotion } from '@/hooks/useReducedMotion'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const heroStats = [
  { value: '~0%', label: 'Avoidable Loss Goal', tone: 'text-primary-700' },
  { value: '24/7', label: 'Telemetry Cold Monitoring', tone: 'text-secondary-600' },
  { value: '8-Step', label: 'Quality Pipeline', tone: 'text-primary-700' },
]

export function Hero() {
  const scopeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const reduced = prefersReducedMotion()
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (reduced) {
        gsap.set(
          ['.hero-badge', '.hero-line', '.hero-sub', '.hero-cta', '.hero-stats', '.hero-panel'],
          { opacity: 1, y: 0, scale: 1 },
        )
        return
      }

      gsap.set('.hero-line', { yPercent: 110 })
      gsap.set(['.hero-badge', '.hero-sub', '.hero-cta', '.hero-stats'], { opacity: 0, y: 16 })
      gsap.set('.hero-panel', { opacity: 0, scale: 0.94, y: 24 })

      tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.6 })
        .to('.hero-line', { yPercent: 0, duration: 0.9, stagger: 0.1 }, '-=0.3')
        .to('.hero-sub', { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
        .to('.hero-cta', { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
        .to('.hero-panel', { opacity: 1, scale: 1, y: 0, duration: 1 }, '-=0.7')
        .to('.hero-stats', { opacity: 1, y: 0, duration: 0.6 }, '-=0.6')
    }, scopeRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={scopeRef}
      className="relative overflow-hidden bg-gradient-hero pt-32 pb-20 lg:pb-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/4 size-[560px] rounded-full bg-primary-200/35 blur-[130px]"
      />

      <Container className="relative grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-14">
        <div className="flex flex-col gap-7">
          <div className="hero-badge">
            <Badge className="border-primary-200/70 bg-primary-100/70 px-4 py-2">
              <span className="size-2 shrink-0 rounded-full bg-secondary-500" />
              Ghana &amp; West Africa Cold-Chain Innovation
            </Badge>
          </div>

          <h1 className="font-display text-[2rem] font-bold leading-[1.04] tracking-[-0.035em] text-neutral-900 sm:text-[2.75rem] lg:text-[3.35rem]">
            <span className="block overflow-hidden">
              <span className="hero-line block">
                Building the <span className="text-primary-700">Cold-Chain</span>
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-line block">
                <span className="text-primary-700">Infrastructure</span> Africa&apos;s
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-line block">Food System Deserves.</span>
            </span>
          </h1>

          <p className="hero-sub max-w-xl text-lg leading-relaxed text-neutral-600">
            Closing the gap between farm and table with temperature-controlled storage,
            quality assurance, and real-time logistics across Ghana.
          </p>

          <div className="hero-cta flex flex-col gap-3 pt-1 sm:flex-row">
            <Button to="/partners" size="lg">
              Become a Partner
            </Button>
            <Button to="/services" variant="secondary" size="lg">
              Explore Our Pipelines
            </Button>
          </div>

          <div className="hero-stats grid grid-cols-2 gap-x-6 gap-y-5 border-t border-primary-900/10 pt-7 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <p className={`font-display text-2xl font-bold tracking-tight ${stat.tone}`}>
                  {stat.value}
                </p>
                <p className="text-xs font-medium leading-snug text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-panel relative">
          <div
            aria-hidden
            className="absolute -inset-5 rounded-[34px] bg-primary-100/70 blur-2xl"
          />
          <div className="relative rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-panel sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 shrink-0 rounded-full bg-primary-500 ring-4 ring-primary-500/15" />
                <p className="text-sm font-semibold text-neutral-900">
                  Live Cold-Hub{' '}
                  <span className="font-normal text-neutral-500">#02 (Accra)</span>
                </p>
              </div>
              <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
                GH-ACC-02
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-primary-50 p-4">
                <p className="text-xs font-medium text-neutral-500">Cold Room Temp</p>
                <p className="mt-1.5 font-display text-3xl font-bold leading-none tracking-tight text-primary-700">
                  3.4°C
                </p>
                <p className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-primary-700">
                  <Check className="size-3" strokeWidth={3} />
                  Ideal Tomato Range
                </p>
              </div>
              <div className="rounded-2xl bg-secondary-50 p-4">
                <p className="text-xs font-medium text-neutral-500">Humidity Control</p>
                <p className="mt-1.5 font-display text-3xl font-bold leading-none tracking-tight text-secondary-600">
                  91%
                </p>
                <p className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-secondary-700">
                  <Droplets className="size-3" strokeWidth={2.5} />
                  Moisture Locked
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/80 px-4 py-3">
                <span className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <Truck className="size-4 shrink-0 text-primary-600" strokeWidth={1.75} />
                  <span>
                    Fleet Route #14{' '}
                    <span className="hidden text-neutral-400 sm:inline">(Kumasi – Accra)</span>
                  </span>
                </span>
                <span className="shrink-0 rounded-md bg-primary-50 px-2 py-1 text-[11px] font-semibold text-primary-700">
                  En Route
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/80 px-4 py-3">
                <span className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <PackageCheck
                    className="size-4 shrink-0 text-secondary-600"
                    strokeWidth={1.75}
                  />
                  Batch #892 Quality Check
                </span>
                <span className="shrink-0 text-xs font-medium text-neutral-700">
                  Grade A+ (Passed)
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
              <span className="text-[11px] text-neutral-400">Updated Just now</span>
              
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
