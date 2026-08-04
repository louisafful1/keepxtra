import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useInventory } from '@/hooks/useAdminQueries'
import { formatCurrency, formatDate, formatKg } from '@/utils/format'
import { cn } from '@/lib/cn'
import type { InventoryItem } from '@/types/admin'
import type { ProduceStatus } from '@/types/farmer'

type ProduceStatusFilter = 'All' | ProduceStatus

const PAGE_SIZE = 8
const statusOptions: ProduceStatusFilter[] = ['All', 'Pending Inspection', 'In Storage', 'Reserved', 'Sold', 'Disposed']

type SortKey = 'crop' | 'quantityKg' | 'storageDate' | 'expiryDate'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'expiryDate', label: 'Expiry Date' },
  { value: 'storageDate', label: 'Storage Date' },
  { value: 'quantityKg', label: 'Quantity' },
  { value: 'crop', label: 'Crop (A–Z)' },
]

export default function InventoryPage() {
  const seo = buildSeo({ title: 'Inventory', description: 'Every batch of produce currently in the KeepXtra network.' })
  const { data, isLoading, isError } = useInventory()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProduceStatusFilter>('All')
  const [sortKey, setSortKey] = useState<SortKey>('expiryDate')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = data ?? []
    if (status !== 'All') rows = rows.filter((r) => r.status === status)
    if (q) rows = rows.filter((r) => r.crop.toLowerCase().includes(q) || r.farmerName.toLowerCase().includes(q) || r.warehouse.toLowerCase().includes(q))
    return [...rows].sort((a, b) => {
      if (sortKey === 'crop') return a.crop.localeCompare(b.crop)
      if (sortKey === 'quantityKg') return b.quantityKg - a.quantityKg
      return a[sortKey].localeCompare(b[sortKey])
    })
  }, [data, query, status, sortKey])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function resetToFirstPage() {
    setPage(1)
  }

  const columns: DataTableColumn<InventoryItem>[] = [
    { header: 'Crop', render: (r) => <span className="font-medium text-neutral-900">{r.crop}</span> },
    { header: 'Farmer', render: (r) => r.farmerName },
    { header: 'Quantity', render: (r) => formatKg(r.quantityKg) },
    { header: 'Value', render: (r) => formatCurrency(r.quantityKg * r.unitValue) },
    { header: 'Warehouse', render: (r) => <span>{r.warehouse}<br /><span className="text-xs text-neutral-400">{r.coldRoom} · {r.storageBin}</span></span> },
    { header: 'Grade', render: (r) => `Grade ${r.grade}` },
    { header: 'Storage Date', render: (r) => formatDate(r.storageDate) },
    { header: 'Expiry Date', render: (r) => formatDate(r.expiryDate) },
    { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Inventory" description="Every batch of produce currently in storage, searchable and filterable." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              resetToFirstPage()
            }}
            placeholder="Search crop, farmer, warehouse…"
            className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {statusOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setStatus(option)
                  resetToFirstPage()
                }}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  status === option
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-neutral-200 text-neutral-600 hover:border-primary-300 hover:bg-primary-50',
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 focus:border-primary-400 focus:outline-none"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pageRows}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load inventory right now." : 'No inventory matches your filters.'}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex size-8 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex size-8 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
