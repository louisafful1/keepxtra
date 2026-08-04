import { Helmet } from 'react-helmet-async'
import { Banknote, CheckCircle2, Clock3 } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { StatCard } from '@/components/portal/StatCard'
import { AsyncState } from '@/components/portal/AsyncState'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useAdminPayouts, useProcessPayout } from '@/hooks/useAdminQueries'
import { formatCurrency, formatDate } from '@/utils/format'
import type { AdminPayoutRecord } from '@/types/admin'

export default function AdminPaymentsPage() {
  const seo = buildSeo({ title: 'Payments', description: 'Process farmer payouts and track storage revenue.' })
  const { data, isLoading, isError } = useAdminPayouts()
  const { mutate: processPayout, isPending } = useProcessPayout()

  const pendingTotal = data?.filter((p) => p.status !== 'Paid').reduce((sum, p) => sum + p.amount, 0) ?? 0
  const paidTotal = data?.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0) ?? 0

  const columns: DataTableColumn<AdminPayoutRecord>[] = [
    { header: 'Farmer', render: (r) => <span className="font-medium text-neutral-900">{r.farmerName}</span> },
    { header: 'Amount', render: (r) => formatCurrency(r.amount) },
    { header: 'Method', render: (r) => r.method },
    { header: 'Requested', render: (r) => formatDate(r.requestedAt) },
    { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      align: 'right',
      render: (r) =>
        r.status !== 'Paid' ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => processPayout(r.id)}
            className="rounded-lg bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50"
          >
            Mark Paid
          </button>
        ) : null,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Payments" description="Process farmer payouts and keep track of what's outstanding." />

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load payments right now.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Clock3} label="Pending Payouts" value={formatCurrency(pendingTotal)} tone="gold" />
          <StatCard icon={CheckCircle2} label="Paid Out" value={formatCurrency(paidTotal)} />
          <StatCard icon={Banknote} label="Total Requests" value={String(data?.length ?? 0)} tone="neutral" />
        </div>
      </AsyncState>

      <DataTable columns={columns} data={data ?? []} keyField={(r) => r.id} isLoading={isLoading} />
    </div>
  )
}
