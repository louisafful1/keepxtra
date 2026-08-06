import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useProduceRecords } from '@/hooks/useFarmerQueries'
import { formatDate, formatKg } from '@/utils/format'
import type { ProduceRecord } from '@/types/farmer'

const columns: DataTableColumn<ProduceRecord>[] = [
  { header: 'Crop', render: (r) => <span className="font-medium text-neutral-900">{r.crop}</span> },
  { header: 'Quantity', render: (r) => formatKg(r.quantityKg) },
  { header: 'Grade', render: (r) => `Grade ${r.grade}` },
  { header: 'Warehouse', render: (r) => r.warehouseLocation },
  { header: 'Date Stored', render: (r) => formatDate(r.dateStored) },
  { header: 'Est. Shelf Life', render: (r) => `${r.estimatedShelfLifeDays} days` },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

export default function MyProducePage() {
  const seo = buildSeo({ title: 'My Produce', description: 'Everything you currently have in KeepXtra storage.' })
  const { data, isLoading, isError } = useProduceRecords()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="My Produce" description="All produce you currently have in KeepXtra storage." />
      <DataTable
        columns={columns}
        data={data ?? []}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load your produce right now." : 'No produce in storage yet.'}
      />
    </div>
  )
}
