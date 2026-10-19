import { motion } from 'framer-motion'
import { NavLink as RouterNavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { navLinks } from '@/data/navLinks'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { EASE_OUT } from '@/animation/variants'

interface MobileMenuProps {
  onClose: () => void
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[60] bg-neutral-950/50 lg:hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        onClick={(e) => e.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-sm flex-col bg-neutral-50 px-6 py-6 shadow-premium"
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-10 flex flex-col gap-1">
          {navLinks.map((link, i) => (
            <motion.div
              key={link.to}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: EASE_OUT }}
            >
              <RouterNavLink
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'block rounded-xl px-4 py-3 text-lg font-medium text-neutral-700 transition-colors hover:bg-white hover:text-neutral-900',
                    isActive && 'bg-white text-neutral-900',
                  )
                }
              >
                {link.label}
              </RouterNavLink>
            </motion.div>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-10">
          <Button to="/contact" variant="primary" className="w-full justify-center" icon>
            Request a Delivery
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
