import type { MouseEvent } from 'react'
import { servicesDetailed } from '@/data/servicesDetailed'
import { useLenis } from '@/hooks/useLenis'

export function ServicesQuickNav() {
  const lenis = useLenis()

  function handleClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault()
    const target = document.getElementById(id)
    if (!target) return
    if (lenis) {
      lenis.scrollTo(target, { offset: -96 })
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="sticky top-16 z-30 border-y border-neutral-200 bg-white/90 backdrop-blur">
      <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-3 sm:px-8 lg:px-12">
        {servicesDetailed.map((service) => (
          <a
            key={service.id}
            href={`#${service.id}`}
            onClick={(event) => handleClick(event, service.id)}
            className="shrink-0 rounded-full border border-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
          >
            {service.title}
          </a>
        ))}
      </div>
    </div>
  )
}
