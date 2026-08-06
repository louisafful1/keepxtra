import type { LucideIcon } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { Sprout, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface PortalNavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

interface PortalSidebarProps {
  navItems: PortalNavItem[]
  badge: string
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function PortalSidebar({ navItems, badge, mobileOpen, onCloseMobile }: PortalSidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-neutral-950/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-white transition-transform duration-300 print:hidden lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-600">
              <Sprout className="size-4 text-white" strokeWidth={2} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-sm font-semibold text-neutral-900">KeepXtra</span>
              <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{badge}</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="flex size-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900',
                      isActive && 'bg-primary-50 text-primary-700 hover:bg-primary-50 hover:text-primary-700',
                    )
                  }
                >
                  <item.icon className="size-[18px]" strokeWidth={1.75} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
