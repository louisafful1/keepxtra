import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/cn'
import { navLinks } from '@/data/navLinks'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { MobileMenu } from '@/components/layout/MobileMenu'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled ? 'surface-nav py-3' : 'bg-transparent py-6',
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <RouterNavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium text-neutral-600 transition-colors duration-200 hover:bg-neutral-900/5 hover:text-neutral-900',
                    isActive && 'text-neutral-900',
                  )
                }
              >
                {link.label}
              </RouterNavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Button to="/login" variant="ghost" size="md">
              Farmer Login
            </Button>
            <Button to="/contact" variant="ghost" size="md">
              Become a Partner
            </Button>
            <Button to="/contact" variant="primary" size="md" icon>
              Request a Delivery
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-10 items-center justify-center rounded-full text-neutral-900 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
