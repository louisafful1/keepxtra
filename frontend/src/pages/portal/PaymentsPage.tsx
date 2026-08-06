import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { CheckCircle2, PiggyBank, Wallet, WalletCards } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { StatCard } from '@/components/portal/StatCard'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { AsyncState } from '@/components/portal/AsyncState'
import { usePaymentsSummary, useRequestPayout } from '@/hooks/useFarmerQueries'
import { formatCurrency, formatDate } from '@/utils/format'
import type { PayoutRecord } from '@/types/farmer'

const columns: DataTableColumn<PayoutRecord>[] = [
  { header: 'Requested', render: (r) => formatDate(r.requestedAt) },
  { header: 'Amount', render: (r) => <span className="font-medium text-neutral-900">{formatCurrency(r.amount)}</span> },
  { header: 'Method', render: (r) => r.method },
  { header: 'Completed', render: (r) => (r.completedAt ? formatDate(r.completedAt) : '—') },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
]

export default function PaymentsPage() {
  const seo = buildSeo({ title: 'Payments', description: 'Your balance, pending payments, and payout history.' })
  const { data, isLoading, isError } = usePaymentsSummary()
  const { mutate: requestPayout, isPending, isSuccess, reset } = useRequestPayout()
  const [formOpen, setFormOpen] = useState(false)
  const [amount, setAmount] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) return
    requestPayout(value, {
      onSuccess: () => {
        setAmount('')
        setFormOpen(false)
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader
        title="Payments"
        description="Your KeepXtra balance and payout history."
        action={
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="rounded-full bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-glow transition-colors hover:bg-primary-600"
          >
            Request Payout
          </button>
        }
      />

      {isSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
          <CheckCircle2 className="size-5 shrink-0" />
          <div className="flex-1">Your payout request has been submitted for processing.</div>
          <button type="button" onClick={() => reset()} className="text-xs font-medium underline">Dismiss</button>
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="payout-amount" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Amount to withdraw (GHS)
            </label>
            <input
              id="payout-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2000"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white shadow-glow transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? 'Submitting…' : 'Confirm Request'}
          </button>
        </form>
      )}

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load your payments right now.">
        {data && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Wallet} label="Current Balance" value={formatCurrency(data.currentBalance)} />
            <StatCard icon={PiggyBank} label="Pending Payments" value={formatCurrency(data.pendingPayments)} tone="gold" />
            <StatCard icon={WalletCards} label="Total Paid Out" value={formatCurrency(data.totalPaidOut)} tone="neutral" />
          </div>
        )}
      </AsyncState>

      <div>
        <h2 className="mb-3 font-display text-base font-semibold text-neutral-900">Withdrawal History</h2>
        <DataTable columns={columns} data={data?.payoutHistory ?? []} keyField={(r) => r.id} isLoading={isLoading} />
      </div>
    </div>
  )
}
