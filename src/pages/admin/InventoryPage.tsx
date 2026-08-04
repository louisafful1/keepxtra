import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useInventory } from '@/hooks/useAdminQueries'
import { formatDate, formatKg } from '@/utils/format'
import type { InventoryItem } from '@/types/admin'

const columns: DataTableColumn<InventoryItem>[] = [
  { header: 'Crop', render: (r) => <span className="font-medium text-neutral-900">{r.crop}</span> },
  { header: 'Farmer', render: (r) => r.farmerName },
  { header: 'Quantity', render: (r) => formatKg(r.quantityKg) },
  { header: 'Grade', render: (r) => `Grade ${r.grade}` },
  { header: 'Warehouse', render: (r) => r.warehouse },
  { header: 'Expiry Date', render: (r) => formatDate(r.expiryDate) },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

export default function InventoryPage() {
  const seo = buildSeo({ title: 'Inventory', description: 'Every batch of produce currently in the KeepXtra network.' })
  const { data, isLoading, isError } = useInventory()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Inventory" description="Every batch of produce currently in storage." />
      <DataTable
        columns={columns}
        data={data ?? []}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load inventory right now." : 'No inventory recorded yet.'}
      />
    </div>
  )
}
