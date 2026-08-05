import { useMemo } from 'react'
import {
  useAdminPayouts,
  useAdminPickupRequests,
  useAdminSales,
  useAdminStorageRequests,
  useDrivers,
  useFarmerAccounts,
  useFleet,
  useInventory,
  useOrders,
  useWarehouses,
} from '@/hooks/useAdminQueries'

export interface SearchResult {
  category: string
  label: string
  sublabel?: string
  href: string
}

/**
 * Client-side global search across every admin-managed entity. All the
 * underlying lists are already fetched via React Query elsewhere in the app
 * (and cached), so this mostly just filters what's in cache — cheap enough
 * to run on every keystroke without debouncing.
 */
export function useAdminSearchIndex(query: string): SearchResult[] {
  const { data: farmers } = useFarmerAccounts()
  const { data: inventory } = useInventory()
  const { data: storageRequests } = useAdminStorageRequests()
  const { data: payouts } = useAdminPayouts()
  const { data: sales } = useAdminSales()
  const { data: fleet } = useFleet()
  const { data: warehouses } = useWarehouses()
  const { data: drivers } = useDrivers()
  const { data: orders } = useOrders()
  const { data: pickups } = useAdminPickupRequests()

  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []

    const results: SearchResult[] = []
    const matches = (...values: (string | undefined)[]) => values.some((v) => v?.toLowerCase().includes(q))

    farmers
      ?.filter((f) => matches(f.name, f.email, f.farmLocation))
      .forEach((f) => results.push({ category: 'Farmers', label: f.name, sublabel: f.farmLocation, href: '/admin/farmers' }))

    inventory
      ?.filter((i) => matches(i.crop, i.farmerName, i.warehouse))
      .forEach((i) => results.push({ category: 'Inventory', label: `${i.crop} · ${i.farmerName}`, sublabel: i.warehouse, href: '/admin/inventory' }))

    storageRequests
      ?.filter((r) => matches(r.crop, r.farmerName))
      .forEach((r) => results.push({ category: 'Storage Requests', label: `${r.crop} · ${r.farmerName}`, sublabel: r.status, href: '/admin/storage-requests' }))

    pickups
      ?.filter((p) => matches(p.crop, p.farmerName, p.driverName))
      .forEach((p) => results.push({ category: 'Pickups', label: `${p.crop} · ${p.farmerName}`, sublabel: p.status, href: '/admin/pickup-requests' }))

    payouts
      ?.filter((p) => matches(p.farmerName, p.method))
      .forEach((p) => results.push({ category: 'Payments', label: `${p.farmerName} — GHS ${p.amount.toLocaleString()}`, sublabel: p.status, href: '/admin/payments' }))

    sales
      ?.filter((s) => matches(s.crop, s.buyer, s.farmerName))
      .forEach((s) => results.push({ category: 'Sales', label: `${s.crop} → ${s.buyer}`, sublabel: s.farmerName, href: '/admin/sales' }))

    fleet
      ?.filter((v) => matches(v.plate, v.driverName, v.type))
      .forEach((v) => results.push({ category: 'Vehicles', label: v.plate, sublabel: v.driverName, href: '/admin/fleet' }))

    warehouses
      ?.filter((w) => matches(w.name, w.code, w.location))
      .forEach((w) => results.push({ category: 'Warehouses', label: w.name, sublabel: w.code, href: '/admin/warehouses' }))

    drivers
      ?.filter((d) => matches(d.name, d.licenseNumber))
      .forEach((d) => results.push({ category: 'Drivers', label: d.name, sublabel: d.availability, href: '/admin/drivers' }))

    orders
      ?.filter((o) => matches(o.buyerName, o.items))
      .forEach((o) => results.push({ category: 'Orders', label: o.buyerName, sublabel: o.items, href: '/admin/orders' }))

    return results.slice(0, 20)
  }, [query, farmers, inventory, storageRequests, payouts, sales, fleet, warehouses, drivers, orders, pickups])
}
