import { Helmet } from 'react-helmet-async'
import { Banknote, CheckCircle2, Clock3 } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { StatCard } from '@/components/portal/StatCard'
import { AsyncState } from '@/components/portal/AsyncState'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useAdminPayouts, useApprovePayout, useProcessPayout, useRejectPayout } from '@/hooks/useAdminQueries'
import { useConfirm } from '@/hooks/useConfirm'
import { formatCurrency, formatDate } from '@/utils/format'
import type { AdminPayoutRecord } from '@/types/admin'

export default function AdminPaymentsPage() {
  const seo = buildSeo({ title: 'Payments', description: 'Approve and process farmer payouts.' })
  const { data, isLoading, isError } = useAdminPayouts()
  const { mutate: approvePayout } = useApprovePayout()
  const { mutate: rejectPayout } = useRejectPayout()
  const { mutate: processPayout, isPending: isProcessing } = useProcessPayout()
  const confirm = useConfirm()

  const pendingTotal = data?.filter((p) => p.status !== 'Paid' && p.status !== 'Rejected').reduce((sum, p) => sum + p.amount, 0) ?? 0
  const paidTotal = data?.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0) ?? 0

  async function handleReject(payout: AdminPayoutRecord) {
    const { confirmed, note } = await confirm({
      title: 'Reject payout?',
      description: `${payout.farmerName}'s request for ${formatCurrency(payout.amount)} will be rejected.`,
      confirmLabel: 'Reject',
      tone: 'danger',
      requireNote: true,
      noteLabel: 'Reason for rejection',
      notePlaceholder: 'e.g. Balance mismatch, please resubmit',
    })
    if (confirmed && note) rejectPayout({ id: payout.id, reason: note })
  }

  async function handleMarkPaid(payout: AdminPayoutRecord) {
    const { confirmed } = await confirm({
      title: 'Mark as paid?',
      description: `Confirm GHS ${payout.amount.toLocaleString()} has been sent to ${payout.farmerName} via ${payout.method}.`,
      confirmLabel: 'Mark Paid',
    })
    if (confirmed) processPayout(payout.id)
  }

  const columns: DataTableColumn<AdminPayoutRecord>[] = [
    { header: 'Farmer', render: (r) => <span className="font-medium text-neutral-900">{r.farmerName}</span> },
    { header: 'Amount', render: (r) => formatCurrency(r.amount) },
    { header: 'Method', render: (r) => r.method },
    { header: 'Requested', render: (r) => formatDate(r.requestedAt) },
    { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      align: 'right',
      render: (r) => {
        if (r.status === 'Pending') {
          return (
            <div className="flex justify-end gap-1.5">
              <button type="button" onClick={() => approvePayout(r.id)} className="rounded-lg bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600">
                Approve
              </button>
              <button type="button" onClick={() => handleReject(r)} className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                Reject
              </button>
            </div>
          )
        }
        if (r.status === 'Approved') {
          return (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleMarkPaid(r)}
              className="rounded-lg bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              Mark Paid
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
      <PageHeader title="Payments" description="Approve, reject, and process farmer payout requests." />

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load payments right now.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Clock3} label="Awaiting Action" value={formatCurrency(pendingTotal)} tone="gold" />
          <StatCard icon={CheckCircle2} label="Paid Out" value={formatCurrency(paidTotal)} />
          <StatCard icon={Banknote} label="Total Requests" value={String(data?.length ?? 0)} tone="neutral" />
        </div>
      </AsyncState>

      <DataTable columns={columns} data={data ?? []} keyField={(r) => r.id} isLoading={isLoading} />
    </div>
  )
}
