import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ChevronDown, Thermometer, Warehouse as WarehouseIcon } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { AsyncState } from '@/components/portal/AsyncState'
import { CardSkeleton } from '@/components/portal/Skeleton'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { MagnitudeBarChart } from '@/components/portal/charts/MagnitudeBarChart'
import { useWarehouses } from '@/hooks/useAdminQueries'
import { formatDate, formatDateTime, formatKg } from '@/utils/format'
import { cn } from '@/lib/cn'

function CapacityBar({ usedPct }: { usedPct: number }) {
  const tone = usedPct >= 90 ? 'bg-red-500' : usedPct >= 75 ? 'bg-amber-500' : 'bg-primary-500'
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
      <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${Math.min(100, usedPct)}%` }} />
    </div>
  )
}

export default function WarehousesPage() {
  const seo = buildSeo({ title: 'Warehouses', description: 'Cold storage capacity and temperature across every hub.' })
  const { data, isLoading, isError } = useWarehouses()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Warehouses" description="Capacity, cold rooms, and temperature across every hub." />

      <AsyncState
        isLoading={isLoading}
        isError={isError}
        errorMessage="Couldn't load warehouses right now."
        loadingSkeleton={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        }
      >
        {data && (
          <>
            <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
              <h2 className="mb-4 font-display text-base font-semibold text-neutral-900">Occupancy by warehouse</h2>
              <MagnitudeBarChart
                data={data.map((w) => ({ label: w.name, value: Math.round((w.currentOccupancyKg / w.coldRoomCapacityKg) * 100) }))}
                valueFormatter={(v) => `${v}%`}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.map((w) => {
                const usedPct = Math.round((w.currentOccupancyKg / w.coldRoomCapacityKg) * 100)
                const available = w.coldRoomCapacityKg - w.currentOccupancyKg
                const expanded = expandedId === w.id
                return (
                  <div key={w.id} className="flex flex-col gap-4 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                          <WarehouseIcon className="size-5" strokeWidth={1.75} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-display text-base font-semibold text-neutral-900">{w.name}</p>
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">{w.code}</span>
                          </div>
                          <p className="text-sm text-neutral-500">{w.address}</p>
                        </div>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        <Thermometer className="size-3.5" /> {w.temperatureC.toFixed(1)}°C
                      </span>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-500">
                        <span>{formatKg(w.currentOccupancyKg)} used</span>
                        <span>{formatKg(w.coldRoomCapacityKg)} capacity</span>
                      </div>
                      <CapacityBar usedPct={usedPct} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-neutral-50 px-2 py-2.5">
                        <p className="text-sm font-semibold text-neutral-900">{usedPct}%</p>
                        <p className="text-[11px] text-neutral-400">Occupied</p>
                      </div>
                      <div className="rounded-xl bg-neutral-50 px-2 py-2.5">
                        <p className="text-sm font-semibold text-neutral-900">{formatKg(available)}</p>
                        <p className="text-[11px] text-neutral-400">Available</p>
                      </div>
                      <div className="rounded-xl bg-neutral-50 px-2 py-2.5">
                        <p className="text-sm font-semibold text-neutral-900">{w.coldRooms.length}</p>
                        <p className="text-[11px] text-neutral-400">Cold Rooms</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : w.id)}
                      className="flex items-center justify-center gap-1.5 rounded-full border border-neutral-200 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                    >
                      {expanded ? 'Hide cold rooms' : 'View cold rooms'}
                      <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
                    </button>

                    {expanded && (
                      <div className="flex flex-col gap-2.5 border-t border-neutral-100 pt-4">
                        {w.coldRooms.map((room) => {
                          const roomUsedPct = Math.round((room.occupancyKg / room.capacityKg) * 100)
                          return (
                            <div key={room.id} className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-neutral-800">{room.name}</p>
                                <StatusBadge status={room.status} />
                              </div>
                              <div className="mt-2">
                                <CapacityBar usedPct={roomUsedPct} />
                              </div>
                              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                                <span>{formatKg(room.occupancyKg)} / {formatKg(room.capacityKg)}</span>
                                <span className="flex items-center gap-1">
                                  <Thermometer className="size-3" /> {room.temperatureC.toFixed(1)}°C
                                </span>
                                <span>Inspected {formatDate(room.lastInspectionDate)}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <p className="text-[11px] text-neutral-300">Last logged {formatDateTime(w.lastLoggedAt)}</p>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </AsyncState>
    </div>
  )
}
