import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useSalesHistory } from '@/hooks/useFarmerQueries'
import { formatCurrency, formatDate, formatKg } from '@/utils/format'
import type { SaleRecord } from '@/types/farmer'

const columns: DataTableColumn<SaleRecord>[] = [
  { header: 'Produce', render: (r) => <span className="font-medium text-neutral-900">{r.crop}</span> },
  { header: 'Quantity', render: (r) => formatKg(r.quantityKg) },
  { header: 'Buyer', render: (r) => r.buyer },
  { header: 'Sale Date', render: (r) => formatDate(r.saleDate) },
  { header: 'Selling Price', render: (r) => formatCurrency(r.sellingPrice), align: 'right' },
  { header: 'Your Earnings', render: (r) => <span className="font-medium text-primary-700">{formatCurrency(r.farmerEarnings)}</span>, align: 'right' },
  { header: 'Payment', render: (r) => <StatusBadge status={r.paymentStatus} /> },
]

export default function SalesHistoryPage() {
  const seo = buildSeo({ title: 'Sales History', description: 'Every sale KeepXtra has made on your behalf.' })
  const { data, isLoading, isError } = useSalesHistory()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Sales History" description="Produce KeepXtra has sold on your behalf." />
      <DataTable
        columns={columns}
        data={data ?? []}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load your sales right now." : 'No sales recorded yet.'}
      />
    </div>
  )
}
