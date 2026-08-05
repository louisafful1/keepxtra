import { Helmet } from 'react-helmet-async'
import { History } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { AsyncState } from '@/components/portal/AsyncState'
import { EmptyState } from '@/components/portal/EmptyState'
import { useAuditLog } from '@/hooks/useAdminQueries'
import { formatDateTime } from '@/utils/format'

export default function AuditLogPage() {
  const seo = buildSeo({ title: 'Audit Log', description: 'A chronological record of every important action across the platform.' })
  const { data, isLoading, isError } = useAuditLog()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Audit Log" description="A chronological record of every important action across the platform." />

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load the audit log right now.">
        {data?.length ? (
          <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-soft">
            <ul className="divide-y divide-neutral-100">
              {data.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1.5 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900">
                      {entry.action} <span className="font-normal text-neutral-400">by {entry.user}</span>
                    </p>
                    <span className="text-xs text-neutral-400">{formatDateTime(entry.timestamp)}</span>
                  </div>
                  <p className="text-sm text-neutral-500">{entry.affectedRecord}</p>
                  {(entry.previousValue || entry.newValue) && (
                    <div className="flex items-center gap-2 text-xs">
                      {entry.previousValue && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-500 line-through decoration-neutral-300">
                          {entry.previousValue}
                        </span>
                      )}
                      {entry.newValue && <span className="rounded-full bg-primary-50 px-2 py-0.5 font-medium text-primary-700">{entry.newValue}</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState icon={History} title="No activity recorded yet" description="Every approval, assignment, and payment will show up here." />
        )}
      </AsyncState>
    </div>
  )
}
