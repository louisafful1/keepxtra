import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useOrders } from '@/hooks/useAdminQueries'
import { formatCurrency, formatDate } from '@/utils/format'
import type { OrderRecord } from '@/types/admin'

const columns: DataTableColumn<OrderRecord>[] = [
  { header: 'Order', render: (r) => <span className="font-medium text-neutral-900">{r.id}</span> },
  { header: 'Buyer', render: (r) => r.buyerName },
  { header: 'Type', render: (r) => r.buyerType },
  { header: 'Items', render: (r) => r.items },
  { header: 'Value', render: (r) => formatCurrency(r.totalValue), align: 'right' },
  { header: 'Ordered', render: (r) => formatDate(r.orderedAt) },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

export default function OrdersPage() {
  const seo = buildSeo({ title: 'Orders', description: 'Buyer orders across restaurants, hotels, retailers, and wholesalers.' })
  const { data, isLoading, isError } = useOrders()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Orders" description="Buyer orders across restaurants, hotels, retailers, and wholesalers." />
      <DataTable
        columns={columns}
        data={data ?? []}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load orders right now." : 'No orders yet.'}
      />
    </div>
  )
}
