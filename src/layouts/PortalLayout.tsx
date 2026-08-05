import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  Bell,
  LayoutDashboard,
  LifeBuoy,
  PackagePlus,
  Receipt,
  Sprout,
  Truck,
  UserCircle,
  Wallet,
} from 'lucide-react'
import { PortalSidebar, type PortalNavItem } from '@/components/portal/PortalSidebar'
import { PortalTopbar } from '@/components/portal/PortalTopbar'
import { CommandPalette } from '@/components/portal/CommandPalette'
import { useFarmerNotifications } from '@/hooks/useFarmerQueries'

const farmerNavItems: PortalNavItem[] = [
  { label: 'Dashboard', to: '/portal', icon: LayoutDashboard, end: true },
  { label: 'My Produce', to: '/portal/produce', icon: Sprout },
  { label: 'Storage Requests', to: '/portal/storage-requests', icon: PackagePlus },
  { label: 'Pickup Requests', to: '/portal/pickup-requests', icon: Truck },
  { label: 'Sales History', to: '/portal/sales', icon: Receipt },
  { label: 'Payments', to: '/portal/payments', icon: Wallet },
  { label: 'Notifications', to: '/portal/notifications', icon: Bell },
  { label: 'Support', to: '/portal/support', icon: LifeBuoy },
  { label: 'Profile', to: '/portal/profile', icon: UserCircle },
]

export function PortalLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: notifications } = useFarmerNotifications()
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <PortalSidebar
        navItems={farmerNavItems}
        badge="Farmer Portal"
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar
          onOpenMobile={() => setMobileOpen(true)}
          notificationCount={unreadCount}
          notificationHref="/portal/notifications"
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
