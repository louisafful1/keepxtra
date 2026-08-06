import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ChevronLeft, ChevronRight, Columns3, Download, Search, Star, X } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useInventory } from '@/hooks/useAdminQueries'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { formatCurrency, formatDate, formatKg } from '@/utils/format'
import { exportToCsv } from '@/utils/exportCsv'
import { getIntelligenceFlags, intelligenceFlagClass, shelfLifeRemaining } from '@/utils/inventoryIntelligence'
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

interface ToggleableColumn {
  key: string
  label: string
}

const toggleableColumns: ToggleableColumn[] = [
  { key: 'farmer', label: 'Farmer' },
  { key: 'value', label: 'Value' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'grade', label: 'Grade' },
  { key: 'storageDate', label: 'Storage Date' },
  { key: 'shelfLife', label: 'Shelf Life' },
  { key: 'flags', label: 'Flags' },
]

interface SavedFilter {
  query: string
  status: ProduceStatusFilter
  sortKey: SortKey
  from: string
  to: string
  visibleColumns: string[]
}

const defaultVisibleColumns = toggleableColumns.map((c) => c.key)

export default function InventoryPage() {
  const seo = buildSeo({ title: 'Inventory', description: 'Every batch of produce currently in the KeepXtra network.' })
  const { data, isLoading, isError } = useInventory()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProduceStatusFilter>('All')
  const [sortKey, setSortKey] = useState<SortKey>('expiryDate')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [columnMenuOpen, setColumnMenuOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useLocalStorageState<string[]>('keepxtra.inventory.columns', defaultVisibleColumns)
  const [savedFilter, setSavedFilter] = useLocalStorageState<SavedFilter | null>('keepxtra.inventory.savedFilter', null)

  function resetToFirstPage() {
    setPage(1)
  }

  function toggleColumn(key: string) {
    setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]))
  }

  function saveCurrentFilter() {
    setSavedFilter({ query, status, sortKey, from, to, visibleColumns })
  }

  function applySavedFilter() {
    if (!savedFilter) return
    setQuery(savedFilter.query)
    setStatus(savedFilter.status)
    setSortKey(savedFilter.sortKey)
    setFrom(savedFilter.from)
    setTo(savedFilter.to)
    setVisibleColumns(savedFilter.visibleColumns)
    resetToFirstPage()
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = data ?? []
    if (status !== 'All') rows = rows.filter((r) => r.status === status)
    if (q) rows = rows.filter((r) => r.crop.toLowerCase().includes(q) || r.farmerName.toLowerCase().includes(q) || r.warehouse.toLowerCase().includes(q))
    if (from) rows = rows.filter((r) => r.storageDate >= from)
    if (to) rows = rows.filter((r) => r.storageDate <= to)
    return [...rows].sort((a, b) => {
      if (sortKey === 'crop') return a.crop.localeCompare(b.crop)
      if (sortKey === 'quantityKg') return b.quantityKg - a.quantityKg
      return a[sortKey].localeCompare(b[sortKey])
    })
  }, [data, query, status, sortKey, from, to])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleExport() {
    exportToCsv(
      'inventory',
      filtered.map((r) => ({
        crop: r.crop,
        farmer: r.farmerName,
        quantityKg: r.quantityKg,
        valueGHS: r.quantityKg * r.unitValue,
        warehouse: r.warehouse,
        coldRoom: r.coldRoom,
        grade: r.grade,
        storageDate: r.storageDate,
        expiryDate: r.expiryDate,
        status: r.status,
      })),
    )
  }

  const isVisible = (key: string) => visibleColumns.includes(key)

  const columns: DataTableColumn<InventoryItem>[] = [
    { header: 'Crop', render: (r) => <span className="font-medium text-neutral-900">{r.crop}</span> },
    ...(isVisible('farmer') ? [{ header: 'Farmer', render: (r: InventoryItem) => r.farmerName }] : []),
    { header: 'Quantity', render: (r) => formatKg(r.quantityKg) },
    ...(isVisible('value') ? [{ header: 'Value', render: (r: InventoryItem) => formatCurrency(r.quantityKg * r.unitValue) }] : []),
    ...(isVisible('warehouse')
      ? [{ header: 'Warehouse', render: (r: InventoryItem) => <span>{r.warehouse}<br /><span className="text-xs text-neutral-400">{r.coldRoom} · {r.storageBin}</span></span> }]
      : []),
    ...(isVisible('grade') ? [{ header: 'Grade', render: (r: InventoryItem) => `Grade ${r.grade}` }] : []),
    ...(isVisible('storageDate') ? [{ header: 'Storage Date', render: (r: InventoryItem) => formatDate(r.storageDate) }] : []),
    ...(isVisible('shelfLife')
      ? [
          {
            header: 'Shelf Life',
            render: (r: InventoryItem) => {
              const days = shelfLifeRemaining(r.expiryDate)
              if (r.status === 'Sold' || r.status === 'Disposed') return <span className="text-neutral-300">—</span>
              return (
                <span className={cn(days < 0 ? 'text-red-600' : days <= 7 ? 'text-amber-600' : 'text-neutral-500')}>
                  {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                </span>
              )
            },
          },
        ]
      : []),
    ...(isVisible('flags')
      ? [
          {
            header: 'Flags',
            render: (r: InventoryItem) => {
              const flags = getIntelligenceFlags(r)
              if (!flags.length) return <span className="text-neutral-300">—</span>
              return (
                <div className="flex flex-wrap gap-1">
                  {flags.map((f) => (
                    <span key={f.label} className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', intelligenceFlagClass(f.tone))}>
                      {f.label}
                    </span>
                  ))}
                </div>
              )
            },
          },
        ]
      : []),
    { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Inventory" description="Every batch of produce currently in storage, searchable and filterable." />

      <div className="flex flex-col gap-3">
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
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); resetToFirstPage() }}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 focus:border-primary-400 focus:outline-none"
              aria-label="Storage date from"
            />
            <span className="text-xs text-neutral-300">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); resetToFirstPage() }}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 focus:border-primary-400 focus:outline-none"
              aria-label="Storage date to"
            />
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

            <div className="relative">
              <button
                type="button"
                onClick={() => setColumnMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                <Columns3 className="size-3.5" /> Columns
              </button>
              {columnMenuOpen && (
                <>
                  <button type="button" aria-label="Close" className="fixed inset-0 z-10" onClick={() => setColumnMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-neutral-200 bg-white p-2 shadow-premium">
                    {toggleableColumns.map((col) => (
                      <label key={col.key} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50">
                        <input
                          type="checkbox"
                          checked={isVisible(col.key)}
                          onChange={() => toggleColumn(col.key)}
                          className="size-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-400"
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={saveCurrentFilter}
              title="Save current search, filters, and columns"
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              <Star className={cn('size-3.5', savedFilter && 'fill-amber-400 text-amber-400')} /> Save View
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              <Download className="size-3.5" /> Export
            </button>
          </div>
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
          {savedFilter && (
            <button
              type="button"
              onClick={applySavedFilter}
              className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              <Star className="size-3.5 fill-amber-500 text-amber-500" /> Load Saved View
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  setSavedFilter(null)
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-amber-200"
              >
                <X className="size-3" />
              </span>
            </button>
          )}
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
