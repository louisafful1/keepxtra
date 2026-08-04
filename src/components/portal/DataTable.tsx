import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface DataTableColumn<T> {
  header: string
  render: (row: T) => ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  keyField: (row: T) => string
  isLoading?: boolean
  emptyMessage?: string
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const

export function DataTable<T>({ columns, data, keyField, isLoading, emptyMessage = 'Nothing to show yet.' }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/60">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={cn(
                    'whitespace-nowrap px-5 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500',
                    alignClass[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <td key={col.header} className="px-5 py-4">
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-neutral-100" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16">
                  <div className="flex flex-col items-center gap-2 text-center text-neutral-400">
                    <Inbox className="size-6" strokeWidth={1.5} />
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              data.map((row) => (
                <tr key={keyField(row)} className="transition-colors hover:bg-neutral-50/80">
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={cn('whitespace-nowrap px-5 py-4 text-neutral-700', alignClass[col.align ?? 'left'], col.className)}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
