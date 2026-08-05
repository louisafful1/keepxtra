import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Boxes,
  Car,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  Package,
  Receipt,
  Search,
  ShoppingCart,
  Truck,
  UserPlus,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAdminSearchIndex } from '@/hooks/useGlobalSearch'
import { cn } from '@/lib/cn'

interface Command {
  id: string
  label: string
  group: string
  icon: LucideIcon
  keywords?: string
  perform: (navigate: ReturnType<typeof useNavigate>) => void
}

const adminCommands: Command[] = [
  { id: 'nav-dashboard', label: 'Dashboard', group: 'Navigate', icon: LayoutDashboard, perform: (n) => n('/admin') },
  { id: 'nav-farmers', label: 'Farmers', group: 'Navigate', icon: Users, perform: (n) => n('/admin/farmers') },
  { id: 'nav-storage', label: 'Storage Requests', group: 'Navigate', icon: FileCheck2, perform: (n) => n('/admin/storage-requests') },
  { id: 'nav-inventory', label: 'Inventory', group: 'Navigate', icon: Boxes, perform: (n) => n('/admin/inventory') },
  { id: 'nav-warehouses', label: 'Warehouses', group: 'Navigate', icon: Warehouse, perform: (n) => n('/admin/warehouses') },
  { id: 'nav-pickups', label: 'Pickup Requests', group: 'Navigate', icon: Truck, perform: (n) => n('/admin/pickup-requests') },
  { id: 'nav-inspections', label: 'Inspections', group: 'Navigate', icon: ClipboardCheck, perform: (n) => n('/admin/inspections') },
  { id: 'nav-fleet', label: 'Fleet', group: 'Navigate', icon: Car, perform: (n) => n('/admin/fleet') },
  { id: 'nav-drivers', label: 'Drivers', group: 'Navigate', icon: Users, perform: (n) => n('/admin/drivers') },
  { id: 'nav-orders', label: 'Orders', group: 'Navigate', icon: ShoppingCart, perform: (n) => n('/admin/orders') },
  { id: 'nav-sales', label: 'Sales', group: 'Navigate', icon: Receipt, perform: (n) => n('/admin/sales') },
  { id: 'nav-payments', label: 'Payments', group: 'Navigate', icon: Wallet, perform: (n) => n('/admin/payments') },
  { id: 'nav-reports', label: 'Reports', group: 'Navigate', icon: ClipboardList, perform: (n) => n('/admin/reports') },
  {
    id: 'action-register-farmer',
    label: 'Register Farmer',
    group: 'Quick Actions',
    icon: UserPlus,
    keywords: 'new farmer add',
    perform: (n) => n('/admin/farmers?action=new'),
  },
  {
    id: 'action-create-sale',
    label: 'Create Sale',
    group: 'Quick Actions',
    icon: Receipt,
    keywords: 'sell record sale',
    perform: (n) => n('/admin/sales?action=new'),
  },
  {
    id: 'action-assign-pickup',
    label: 'Assign Pickup',
    group: 'Quick Actions',
    icon: Truck,
    keywords: 'driver vehicle',
    perform: (n) => n('/admin/pickup-requests'),
  },
]

const farmerCommands: Command[] = [
  { id: 'nav-portal-dashboard', label: 'Dashboard', group: 'Navigate', icon: LayoutDashboard, perform: (n) => n('/portal') },
  { id: 'nav-produce', label: 'My Produce', group: 'Navigate', icon: Package, perform: (n) => n('/portal/produce') },
  {
    id: 'action-storage-request',
    label: 'Create Storage Request',
    group: 'Quick Actions',
    icon: FileCheck2,
    keywords: 'new request storage',
    perform: (n) => n('/portal/storage-requests?action=new'),
  },
  { id: 'nav-pickups', label: 'Pickup Requests', group: 'Navigate', icon: Truck, perform: (n) => n('/portal/pickup-requests') },
  { id: 'nav-sales', label: 'Sales History', group: 'Navigate', icon: Receipt, perform: (n) => n('/portal/sales') },
  { id: 'nav-payments', label: 'Payments', group: 'Navigate', icon: Wallet, perform: (n) => n('/portal/payments') },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()
  const { user } = useAuth()
  const searchResults = useAdminSearchIndex(user?.role === 'admin' ? query : '')

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    function handleOpenEvent() {
      setOpen(true)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleOpenEvent)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleOpenEvent)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const baseCommands = user?.role === 'admin' ? adminCommands : farmerCommands

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return baseCommands
    return baseCommands.filter((c) => c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q))
  }, [baseCommands, query])

  const flatResults = useMemo(
    () => [
      ...filteredCommands.map((c) => ({ kind: 'command' as const, command: c })),
      ...searchResults.map((r) => ({ kind: 'result' as const, result: r })),
    ],
    [filteredCommands, searchResults],
  )

  function runCommand(command: Command) {
    command.perform(navigate)
    setOpen(false)
  }

  function runResult(href: string) {
    navigate(href)
    setOpen(false)
  }

  function handleKeyNav(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatResults[activeIndex]
      if (!item) return
      if (item.kind === 'command') runCommand(item.command)
      else runResult(item.result.href)
    }
  }

  const groups = useMemo(() => {
    const map = new Map<string, typeof flatResults>()
    flatResults.forEach((item) => {
      const groupName = item.kind === 'command' ? item.command.group : `Search Results — ${item.result.category}`
      if (!map.has(groupName)) map.set(groupName, [])
      map.get(groupName)!.push(item)
    })
    return Array.from(map.entries())
  }, [flatResults])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-start justify-center bg-neutral-950/40 pt-24"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-premium"
          >
            <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3.5">
              <Search className="size-4 shrink-0 text-neutral-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyNav}
                placeholder="Search or run a command…"
                className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
              <kbd className="hidden shrink-0 rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 sm:block">ESC</kbd>
            </div>

            <div className="max-h-96 overflow-y-auto py-2">
              {flatResults.length === 0 && <p className="px-4 py-8 text-center text-sm text-neutral-400">No matches for "{query}"</p>}
              {groups.map(([groupName, items]) => (
                <div key={groupName} className="px-2 py-1.5">
                  <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">{groupName}</p>
                  {items.map((item) => {
                    const globalIndex = flatResults.indexOf(item)
                    const isActive = globalIndex === activeIndex
                    if (item.kind === 'command') {
                      const Icon = item.command.icon
                      return (
                        <button
                          key={item.command.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(globalIndex)}
                          onClick={() => runCommand(item.command)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm',
                            isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-50',
                          )}
                        >
                          <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                          {item.command.label}
                        </button>
                      )
                    }
                    return (
                      <button
                        key={item.result.href + item.result.label}
                        type="button"
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                        onClick={() => runResult(item.result.href)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm',
                          isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-50',
                        )}
                      >
                        <span className="truncate">{item.result.label}</span>
                        {item.result.sublabel && <span className="shrink-0 text-xs text-neutral-400">{item.result.sublabel}</span>}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
