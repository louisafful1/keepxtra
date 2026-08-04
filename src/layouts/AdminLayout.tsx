import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  BarChart3,
  Boxes,
  Car,
  ClipboardList,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from 'lucide-react'
import { PortalSidebar, type PortalNavItem } from '@/components/portal/PortalSidebar'
import { PortalTopbar } from '@/components/portal/PortalTopbar'

const adminNavItems: PortalNavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Farmers', to: '/admin/farmers', icon: Users },
  { label: 'Inventory', to: '/admin/inventory', icon: Boxes },
  { label: 'Warehouses', to: '/admin/warehouses', icon: Warehouse },
  { label: 'Pickup Requests', to: '/admin/pickup-requests', icon: Truck },
  { label: 'Fleet', to: '/admin/fleet', icon: Car },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Sales', to: '/admin/sales', icon: Receipt },
  { label: 'Payments', to: '/admin/payments', icon: Wallet },
  { label: 'Reports', to: '/admin/reports', icon: ClipboardList },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <PortalSidebar
        navItems={adminNavItems}
        badge="Admin"
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
