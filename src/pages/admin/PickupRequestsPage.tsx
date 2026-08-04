import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { AssignPickupModal } from '@/components/portal/AssignPickupModal'
import { ReceivingModal } from '@/components/portal/ReceivingModal'
import { useAdminPickupRequests, useAdvancePickupStatus, useApprovePickupRequest } from '@/hooks/useAdminQueries'
import { formatDate, formatKg } from '@/utils/format'
import type { AdminPickupRequest } from '@/types/admin'
import type { PickupStatus } from '@/types/farmer'

const nextAction: Partial<Record<PickupStatus, { label: string; next: PickupStatus }>> = {
  'Driver Assigned': { label: 'Mark En Route', next: 'Driver En Route' },
  'Driver En Route': { label: 'Mark Collected', next: 'Collected' },
  Collected: { label: 'Mark Delivered', next: 'Delivered to Warehouse' },
}

export default function AdminPickupRequestsPage() {
  const seo = buildSeo({ title: 'Pickup Requests', description: 'Assign drivers and track pickups to the warehouse.' })
  const { data, isLoading, isError } = useAdminPickupRequests()
  const { mutate: approve } = useApprovePickupRequest()
  const { mutate: advance } = useAdvancePickupStatus()
  const [assigning, setAssigning] = useState<AdminPickupRequest | null>(null)
  const [receiving, setReceiving] = useState<AdminPickupRequest | null>(null)

  const columns: DataTableColumn<AdminPickupRequest>[] = [
    { header: 'Farmer', render: (r) => <span className="font-medium text-neutral-900">{r.farmerName}</span> },
    { header: 'Crop', render: (r) => r.crop },
    { header: 'Quantity', render: (r) => formatKg(r.quantityKg) },
    { header: 'Pickup Location', render: (r) => r.pickupLocation },
    { header: 'Pickup Date', render: (r) => formatDate(r.pickupDate ?? r.preferredPickupDate) },
    { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Driver / Vehicle',
      render: (r) => (r.driverName ? <span className="text-neutral-500">{r.driverName} · {r.vehiclePlate}</span> : <span className="text-neutral-400">—</span>),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (r) => {
        if (r.status === 'Pending') {
          return (
            <button type="button" onClick={() => approve(r.id)} className="rounded-lg bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600">
              Approve
            </button>
          )
        }
        if (r.status === 'Approved') {
          return (
            <button type="button" onClick={() => setAssigning(r)} className="rounded-lg bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600">
              Assign Pickup
            </button>
          )
        }
        if (r.status === 'Delivered to Warehouse') {
          return (
            <button type="button" onClick={() => setReceiving(r)} className="rounded-lg bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600">
              Receive at Warehouse
            </button>
          )
        }
        const action = nextAction[r.status]
        if (action) {
          return (
            <button
              type="button"
              onClick={() => advance({ id: r.id, status: action.next })}
              className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              {action.label}
            </button>
          )
        }
        return null
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Pickup Requests" description="Assign drivers, track collection, and receive produce at the warehouse." />
      <DataTable
        columns={columns}
        data={data ?? []}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load pickup requests right now." : 'No pickup requests yet.'}
      />
      <AssignPickupModal pickup={assigning} onClose={() => setAssigning(null)} />
      <ReceivingModal pickup={receiving} onClose={() => setReceiving(null)} />
    </div>
  )
}
