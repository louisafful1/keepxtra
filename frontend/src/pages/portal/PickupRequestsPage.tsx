import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { usePickupRequests } from '@/hooks/useFarmerQueries'
import { formatDate, formatKg } from '@/utils/format'
import type { PickupRequest } from '@/types/farmer'

const columns: DataTableColumn<PickupRequest>[] = [
  { header: 'Crop', render: (r) => <span className="font-medium text-neutral-900">{r.crop}</span> },
  { header: 'Quantity', render: (r) => formatKg(r.quantityKg) },
  { header: 'Pickup Location', render: (r) => r.pickupLocation },
  { header: 'Preferred Date', render: (r) => formatDate(r.preferredPickupDate) },
  {
    header: 'Driver / Vehicle',
    render: (r) => (r.driverName ? `${r.driverName} · ${r.vehiclePlate}` : <span className="text-neutral-400">Not yet assigned</span>),
  },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

export default function PickupRequestsPage() {
  const seo = buildSeo({ title: 'Pickup Requests', description: 'Track the status of every pickup request.' })
  const { data, isLoading, isError } = usePickupRequests()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Pickup Requests" description="Track every pickup from request to delivery at the warehouse." />
      <DataTable
        columns={columns}
        data={data ?? []}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load pickup requests right now." : 'No pickup requests yet.'}
      />
    </div>
  )
}
