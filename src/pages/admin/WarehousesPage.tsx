import { Helmet } from 'react-helmet-async'
import { Thermometer } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { AsyncState } from '@/components/portal/AsyncState'
import { MagnitudeBarChart } from '@/components/portal/charts/MagnitudeBarChart'
import { useWarehouses } from '@/hooks/useAdminQueries'
import { formatDateTime, formatKg } from '@/utils/format'

export default function WarehousesPage() {
  const seo = buildSeo({ title: 'Warehouses', description: 'Cold storage capacity and temperature across every hub.' })
  const { data, isLoading, isError } = useWarehouses()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Warehouses" description="Cold room capacity, occupancy, and temperature across every hub." />

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load warehouses right now.">
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
                return (
                  <div key={w.id} className="flex flex-col gap-4 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-display text-base font-semibold text-neutral-900">{w.name}</p>
                        <p className="text-sm text-neutral-500">{w.location}</p>
                      </div>
                      <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        <Thermometer className="size-3.5" /> {w.temperatureC.toFixed(1)}°C
                      </span>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-500">
                        <span>{formatKg(w.currentOccupancyKg)} used</span>
                        <span>{formatKg(w.coldRoomCapacityKg)} capacity</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary-100">
                        <div className="h-full rounded-full bg-primary-500" style={{ width: `${usedPct}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">{formatKg(available)} available</span>
                      <span className="text-neutral-400">Logged {formatDateTime(w.lastLoggedAt)}</span>
                    </div>
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
