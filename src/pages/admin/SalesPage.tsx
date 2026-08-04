import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { useAdminSales } from '@/hooks/useAdminQueries'
import { formatCurrency, formatDate, formatKg } from '@/utils/format'
import type { AdminSaleRecord } from '@/types/admin'

const columns: DataTableColumn<AdminSaleRecord>[] = [
  { header: 'Crop', render: (r) => <span className="font-medium text-neutral-900">{r.crop}</span> },
  { header: 'Buyer', render: (r) => <span>{r.buyer}<br /><span className="text-xs text-neutral-400">{r.buyerType}</span></span> },
  { header: 'Quantity', render: (r) => formatKg(r.quantityKg) },
  { header: 'Sale Date', render: (r) => formatDate(r.saleDate) },
  { header: 'Selling Price', render: (r) => formatCurrency(r.sellingPrice), align: 'right' },
  { header: 'Commission', render: (r) => <span className="font-medium text-primary-700">{formatCurrency(r.commission)}</span>, align: 'right' },
  { header: 'Invoice', render: (r) => <span className="font-mono text-xs text-neutral-500">{r.invoiceId}</span> },
]

export default function SalesPage() {
  const seo = buildSeo({ title: 'Sales', description: 'All sales made to restaurants, hotels, retailers, and wholesalers.' })
  const { data, isLoading, isError } = useAdminSales()

  const totalCommission = data?.reduce((sum, s) => sum + s.commission, 0) ?? 0

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader
        title="Sales"
        description="Every sale made on behalf of farmers, with commission tracked per transaction."
        action={
          data && (
            <div className="rounded-xl border border-neutral-200/70 bg-white px-4 py-2.5 text-right shadow-soft">
              <p className="text-xs text-neutral-400">Total commission</p>
              <p className="font-display text-lg font-semibold text-primary-700">{formatCurrency(totalCommission)}</p>
            </div>
          )
        }
      />
      <DataTable
        columns={columns}
        data={data ?? []}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load sales right now." : 'No sales recorded yet.'}
      />
    </div>
  )
}
