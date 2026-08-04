import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useAdminPickupRequests, useApprovePickupRequest, useAssignDriver } from '@/hooks/useAdminQueries'
import { formatDate, formatKg } from '@/utils/format'
import type { AdminPickupRequest } from '@/types/admin'

function AssignDriverForm({ id, onDone }: { id: string; onDone: () => void }) {
  const { mutate, isPending } = useAssignDriver()
  const [driverName, setDriverName] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')

  return (
    <div className="flex items-center justify-end gap-1.5">
      <input
        value={driverName}
        onChange={(e) => setDriverName(e.target.value)}
        placeholder="Driver"
        className="w-24 rounded-lg border border-neutral-200 px-2 py-1 text-xs focus:border-primary-400 focus:outline-none"
      />
      <input
        value={vehiclePlate}
        onChange={(e) => setVehiclePlate(e.target.value)}
        placeholder="Plate"
        className="w-20 rounded-lg border border-neutral-200 px-2 py-1 text-xs focus:border-primary-400 focus:outline-none"
      />
      <button
        type="button"
        disabled={isPending || !driverName || !vehiclePlate}
        onClick={() => mutate({ id, driverName, vehiclePlate }, { onSuccess: onDone })}
        className="rounded-lg bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50"
      >
        Save
      </button>
    </div>
  )
}

export default function AdminPickupRequestsPage() {
  const seo = buildSeo({ title: 'Pickup Requests', description: 'Approve pickups and assign drivers.' })
  const { data, isLoading, isError } = useAdminPickupRequests()
  const { mutate: approve } = useApprovePickupRequest()
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const columns: DataTableColumn<AdminPickupRequest>[] = [
    { header: 'Farmer', render: (r) => <span className="font-medium text-neutral-900">{r.farmerName}</span> },
    { header: 'Crop', render: (r) => r.crop },
    { header: 'Quantity', render: (r) => formatKg(r.quantityKg) },
    { header: 'Pickup Location', render: (r) => r.pickupLocation },
    { header: 'Preferred Date', render: (r) => formatDate(r.preferredPickupDate) },
    { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      align: 'right',
      render: (r) => {
        if (r.status === 'Pending') {
          return (
            <button
              type="button"
              onClick={() => approve(r.id)}
              className="rounded-lg bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600"
            >
              Approve
            </button>
          )
        }
        if (r.status === 'Approved') {
          return assigningId === r.id ? (
            <AssignDriverForm id={r.id} onDone={() => setAssigningId(null)} />
          ) : (
            <button
              type="button"
              onClick={() => setAssigningId(r.id)}
              className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Assign Driver
            </button>
          )
        }
        return r.driverName ? <span className="text-xs text-neutral-400">{r.driverName} · {r.vehiclePlate}</span> : null
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Pickup Requests" description="Approve requests and assign drivers to collect produce." />
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
