import { Helmet } from 'react-helmet-async'
import { Car, Fuel, HeartPulse, Wrench } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { StatCard } from '@/components/portal/StatCard'
import { AsyncState } from '@/components/portal/AsyncState'
import { StatCardSkeletonGrid } from '@/components/portal/Skeleton'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useFleet } from '@/hooks/useAdminQueries'
import { formatDate, formatNumber } from '@/utils/format'
import { cn } from '@/lib/cn'
import type { FleetVehicle } from '@/types/admin'

function MiniBar({ pct, warnBelow = 30 }: { pct: number; warnBelow?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
        <div className={cn('h-full rounded-full', pct < warnBelow ? 'bg-amber-500' : 'bg-primary-500')} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-neutral-500">{pct}%</span>
    </div>
  )
}

const columns: DataTableColumn<FleetVehicle>[] = [
  { header: 'Vehicle', render: (r) => <span>{r.plate}<br /><span className="text-xs text-neutral-400">{r.registrationNumber}</span></span> },
  { header: 'Type', render: (r) => r.type },
  { header: 'Driver', render: (r) => r.driverName },
  { header: 'Assignment', render: (r) => <span className="text-neutral-500">{r.currentAssignment}</span> },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { header: 'Fuel', render: (r) => <MiniBar pct={r.fuelLevelPct} /> },
  { header: 'Health', render: (r) => <MiniBar pct={r.healthScorePct} warnBelow={60} /> },
  { header: 'Mileage', render: (r) => `${formatNumber(r.mileageKm)} km` },
  {
    header: 'Maintenance',
    render: (r) => (
      <span>
        <StatusBadge status={r.maintenanceStatus} />
        <br />
        <span className="text-xs text-neutral-400">Due {formatDate(r.nextServiceDue)}</span>
      </span>
    ),
  },
]

export default function FleetPage() {
  const seo = buildSeo({ title: 'Fleet', description: 'Delivery vehicles, drivers, and maintenance status.' })
  const { data, isLoading, isError } = useFleet()

  const total = data?.length ?? 0
  const available = data?.filter((v) => v.status === 'Available').length ?? 0
  const inMaintenance = data?.filter((v) => v.status === 'Maintenance').length ?? 0
  const avgHealth = data?.length ? Math.round(data.reduce((sum, v) => sum + v.healthScorePct, 0) / data.length) : 0

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Fleet" description="Delivery vehicles, driver assignments, and maintenance status." />

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load the fleet right now." loadingSkeleton={<StatCardSkeletonGrid count={4} />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Car} label="Total Vehicles" value={String(total)} />
          <StatCard icon={Fuel} label="Available Now" value={String(available)} tone="neutral" />
          <StatCard icon={Wrench} label="In Maintenance" value={String(inMaintenance)} tone="gold" />
          <StatCard icon={HeartPulse} label="Avg. Fleet Health" value={`${avgHealth}%`} />
        </div>
      </AsyncState>

      <DataTable
        columns={columns}
        data={data ?? []}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load the fleet right now." : 'No vehicles registered yet.'}
      />
    </div>
  )
}
