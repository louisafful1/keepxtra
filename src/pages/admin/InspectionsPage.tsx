import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ClipboardCheck } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { InspectionModal } from '@/components/portal/InspectionModal'
import { useInspections, useInventory } from '@/hooks/useAdminQueries'
import { formatDate } from '@/utils/format'
import type { InspectionRecord } from '@/types/admin'

const columns: DataTableColumn<InspectionRecord>[] = [
  { header: 'Crop', render: (r) => <span className="font-medium text-neutral-900">{r.crop}</span> },
  { header: 'Farmer', render: (r) => r.farmerName },
  { header: 'Inspection Date', render: (r) => formatDate(r.inspectionDate) },
  { header: 'Inspector', render: (r) => r.inspector },
  { header: 'Grade', render: (r) => `Grade ${r.grade}` },
  { header: 'Photos', render: (r) => `${r.photos.length} attached` },
  { header: 'Outcome', render: (r) => <StatusBadge status={r.outcome} /> },
]

export default function InspectionsPage() {
  const seo = buildSeo({ title: 'Quality Inspections', description: 'Inspect incoming produce before it enters cold storage.' })
  const { data, isLoading, isError } = useInspections()
  const { data: inventory } = useInventory()
  const [modalOpen, setModalOpen] = useState(false)
  const pendingCount = inventory?.filter((i) => i.status === 'Pending Inspection').length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader
        title="Quality Inspections"
        description="Every batch is inspected before it's approved for cold storage."
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-glow hover:bg-primary-600"
          >
            <ClipboardCheck className="size-4" /> New Inspection
          </button>
        }
      />

      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {pendingCount} batch{pendingCount === 1 ? '' : 'es'} waiting for inspection.
        </div>
      )}

      <DataTable
        columns={columns}
        data={data ?? []}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load inspections right now." : 'No inspections recorded yet.'}
      />

      <InspectionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
