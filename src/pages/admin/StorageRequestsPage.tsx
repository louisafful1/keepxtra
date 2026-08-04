import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import {
  useAdminStorageRequests,
  useApproveStorageRequest,
  useRejectStorageRequest,
  useRequestStorageInfo,
} from '@/hooks/useAdminQueries'
import { useConfirm } from '@/hooks/useConfirm'
import { formatDate, formatKg } from '@/utils/format'
import type { AdminStorageRequest } from '@/types/admin'

export default function AdminStorageRequestsPage() {
  const seo = buildSeo({ title: 'Storage Requests', description: 'Review and approve farmer storage requests.' })
  const { data, isLoading, isError } = useAdminStorageRequests()
  const { mutate: approve } = useApproveStorageRequest()
  const { mutate: reject } = useRejectStorageRequest()
  const { mutate: requestInfo } = useRequestStorageInfo()
  const confirm = useConfirm()

  async function handleApprove(request: AdminStorageRequest) {
    const { confirmed } = await confirm({
      title: 'Approve storage request?',
      description: `This creates a pickup request for ${request.quantityKg}kg of ${request.crop} from ${request.farmerName}.`,
      confirmLabel: 'Approve',
    })
    if (confirmed) approve(request.id)
  }

  async function handleReject(request: AdminStorageRequest) {
    const { confirmed, note } = await confirm({
      title: 'Reject storage request?',
      description: `${request.farmerName}'s request for ${request.crop} will be rejected.`,
      confirmLabel: 'Reject',
      tone: 'danger',
      requireNote: true,
      noteLabel: 'Reason for rejection',
      notePlaceholder: 'e.g. Quantity exceeds available capacity this week',
    })
    if (confirmed && note) reject({ id: request.id, reason: note })
  }

  async function handleRequestInfo(request: AdminStorageRequest) {
    const { confirmed, note } = await confirm({
      title: 'Request more information?',
      description: `Ask ${request.farmerName} for more details before deciding.`,
      confirmLabel: 'Send Request',
      requireNote: true,
      noteLabel: 'What do you need to know?',
      notePlaceholder: 'e.g. Can you confirm the exact harvest date?',
    })
    if (confirmed && note) requestInfo({ id: request.id, message: note })
  }

  const columns: DataTableColumn<AdminStorageRequest>[] = [
    { header: 'Farmer', render: (r) => <span className="font-medium text-neutral-900">{r.farmerName}</span> },
    { header: 'Crop', render: (r) => r.crop },
    { header: 'Quantity', render: (r) => formatKg(r.quantityKg) },
    { header: 'Harvest Date', render: (r) => formatDate(r.harvestDate) },
    { header: 'Preferred Pickup', render: (r) => formatDate(r.preferredPickupDate) },
    { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      align: 'right',
      render: (r) =>
        r.status === 'Pending' || r.status === 'Info Requested' ? (
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => handleApprove(r)}
              className="rounded-lg bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleRequestInfo(r)}
              className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Request Info
            </button>
            <button
              type="button"
              onClick={() => handleReject(r)}
              className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Reject
            </button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Storage Requests" description="Review incoming requests before they become pickups." />
      <DataTable
        columns={columns}
        data={data ?? []}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load storage requests right now." : 'No storage requests yet.'}
      />
    </div>
  )
}
