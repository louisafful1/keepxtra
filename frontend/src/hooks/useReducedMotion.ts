import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

/**
 * Single source of truth for prefers-reduced-motion, so Lenis, GSAP, and
 * Framer Motion variants all gate off the same signal.
 */
export function useReducedMotion() {
  return useFramerReducedMotion() ?? false
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
