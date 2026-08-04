import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useFleet } from '@/hooks/useAdminQueries'
import { formatDate, formatNumber } from '@/utils/format'
import { cn } from '@/lib/cn'
import type { FleetVehicle } from '@/types/admin'

const columns: DataTableColumn<FleetVehicle>[] = [
  { header: 'Plate', render: (r) => <span className="font-medium text-neutral-900">{r.plate}</span> },
  { header: 'Type', render: (r) => r.type },
  { header: 'Driver', render: (r) => r.driverName },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  {
    header: 'Fuel',
    render: (r) => (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
          <div
            className={cn('h-full rounded-full', r.fuelLevelPct < 30 ? 'bg-amber-500' : 'bg-primary-500')}
            style={{ width: `${r.fuelLevelPct}%` }}
          />
        </div>
        <span className="text-xs text-neutral-500">{r.fuelLevelPct}%</span>
      </div>
    ),
  },
  { header: 'Mileage', render: (r) => `${formatNumber(r.mileageKm)} km` },
  { header: 'Last Maintenance', render: (r) => formatDate(r.lastMaintenanceAt) },
]

export default function FleetPage() {
  const seo = buildSeo({ title: 'Fleet', description: 'Delivery vehicles, drivers, and maintenance status.' })
  const { data, isLoading, isError } = useFleet()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Fleet" description="Delivery vehicles, driver assignments, and maintenance status." />
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
