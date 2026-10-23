import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLenis } from '@/hooks/useLenis'

/**
 * Resets the scroll position to the top whenever the route changes, so every
 * page opens at its navbar/hero instead of inheriting the previous page's
 * scroll offset. Works with Lenis (instant jump, no smooth-scroll animation).
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const lenis = useLenis()

  // Stop the browser from restoring the previous scroll offset on navigation
  // (including back/forward), which is what caused new pages to open mid-way.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, lenis])

  return null
}
