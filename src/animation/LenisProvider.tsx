import { createContext, useEffect, useRef, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { ensureGsapRegistered, ScrollTrigger } from '@/animation/gsapConfig'
import { prefersReducedMotion } from '@/hooks/useReducedMotion'

export const LenisContext = createContext<Lenis | null>(null)

export function LenisProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const rafId = useRef<number>(0)

  useEffect(() => {
    ensureGsapRegistered()

    const reduced = prefersReducedMotion()
    const instance = new Lenis({
      duration: reduced ? 0.01 : 1.1,
      smoothWheel: !reduced,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    })

    function raf(time: number) {
      instance.raf(time)
      rafId.current = requestAnimationFrame(raf)
    }
    rafId.current = requestAnimationFrame(raf)

    instance.on('scroll', ScrollTrigger.update)

    document.fonts?.ready.then(() => ScrollTrigger.refresh())

    setLenis(instance)

    return () => {
      cancelAnimationFrame(rafId.current)
      instance.off('scroll', ScrollTrigger.update)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
