import { useRef } from 'react'
import { useInView } from 'framer-motion'

/** Thin wrapper around Framer's useInView for components that need imperative access to viewport state (e.g. to kick off a GSAP timeline). */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(amount: number = 0.3) {
  const ref = useRef<T>(null)
  const inView = useInView(ref, { once: true, amount })
  return { ref, inView }
}
