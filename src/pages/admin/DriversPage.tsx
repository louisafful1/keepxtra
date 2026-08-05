import { Helmet } from 'react-helmet-async'
import { Phone, Star, Truck, Users } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { StatCard } from '@/components/portal/StatCard'
import { AsyncState } from '@/components/portal/AsyncState'
import { StatCardSkeletonGrid } from '@/components/portal/Skeleton'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { EmptyState } from '@/components/portal/EmptyState'
import { useDrivers } from '@/hooks/useAdminQueries'

export default function DriversPage() {
  const seo = buildSeo({ title: 'Drivers', description: 'Every driver in the KeepXtra delivery network.' })
  const { data, isLoading, isError } = useDrivers()

  const available = data?.filter((d) => d.availability === 'Available').length ?? 0
  const onDelivery = data?.filter((d) => d.availability === 'On Delivery').length ?? 0
  const avgRating = data?.length ? (data.reduce((sum, d) => sum + d.performanceRating, 0) / data.length).toFixed(1) : '0.0'

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Drivers" description="Every driver in the KeepXtra delivery network." />

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load drivers right now." loadingSkeleton={<StatCardSkeletonGrid count={3} />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Users} label="Total Drivers" value={String(data?.length ?? 0)} />
          <StatCard icon={Truck} label="Available Now" value={String(available)} />
          <StatCard icon={Star} label="Avg. Rating" value={avgRating} tone="gold" hint={`${onDelivery} on delivery`} />
        </div>

        {data?.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((driver) => (
              <div key={driver.id} className="flex flex-col gap-4 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {driver.avatarInitials}
                    </span>
                    <div>
                      <p className="font-display text-sm font-semibold text-neutral-900">{driver.name}</p>
                      <p className="text-xs text-neutral-400">{driver.licenseNumber}</p>
                    </div>
                  </div>
                  <StatusBadge status={driver.availability} />
                </div>

                <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <Phone className="size-3.5" /> {driver.phone}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-neutral-50 px-2 py-2.5">
                    <p className="text-sm font-semibold text-neutral-900">{driver.todaysDeliveries}</p>
                    <p className="text-[11px] text-neutral-400">Today</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 px-2 py-2.5">
                    <p className="text-sm font-semibold text-neutral-900">{driver.completedDeliveries}</p>
                    <p className="text-[11px] text-neutral-400">Completed</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 px-2 py-2.5">
                    <p className="flex items-center justify-center gap-0.5 text-sm font-semibold text-neutral-900">
                      <Star className="size-3 fill-amber-400 text-amber-400" /> {driver.performanceRating}
                    </p>
                    <p className="text-[11px] text-neutral-400">Rating</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                  <Truck className="size-3.5 text-neutral-400" />
                  {driver.assignedVehiclePlate ? `Assigned to ${driver.assignedVehiclePlate}` : 'No vehicle assigned'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="No drivers yet" description="Drivers you add to the fleet will show up here." />
        )}
      </AsyncState>
    </div>
  )
}
