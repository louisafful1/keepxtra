import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let registered = false

/** Registers ScrollTrigger once and applies sane global defaults. Safe to call repeatedly. */
export function ensureGsapRegistered() {
  if (registered) return
  gsap.registerPlugin(ScrollTrigger)
  gsap.defaults({ ease: 'power3.out' })
  registered = true
}

export { gsap, ScrollTrigger }
