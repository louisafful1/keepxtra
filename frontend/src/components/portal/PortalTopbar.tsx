import { useState } from 'react'
import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'

interface PortalTopbarProps {
  onOpenMobile: () => void
  notificationCount?: number
  notificationHref?: string
}

export function PortalTopbar({ onOpenMobile, notificationCount, notificationHref }: PortalTopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 backdrop-blur print:hidden sm:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Open menu"
        className="flex size-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
        className="hidden items-center gap-2.5 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-sm text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600 lg:flex"
      >
        <Search className="size-3.5" />
        Search or run a command…
        <kbd className="ml-6 rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">Ctrl K</kbd>
      </button>

      <div className="flex items-center gap-2">
        {notificationHref && (
          <Link
            to={notificationHref}
            aria-label="Notifications"
            className="relative flex size-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
          >
            <Bell className="size-[18px]" strokeWidth={1.75} />
            {Boolean(notificationCount) && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-semibold text-white">
                {notificationCount! > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>
        )}

        <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-neutral-100"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
            {user?.avatarInitials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight text-neutral-900">{user?.name}</span>
            <span className="block text-xs capitalize leading-tight text-neutral-400">{user?.role}</span>
          </span>
          <ChevronDown className={cn('size-4 text-neutral-400 transition-transform', menuOpen && 'rotate-180')} />
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-premium">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-red-600"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </header>
  )
}
