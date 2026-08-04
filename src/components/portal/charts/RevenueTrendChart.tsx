import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RevenueTrendPoint } from '@/types/admin'
import { formatCurrency } from '@/utils/format'

const GREEN = '#16A34A'
const GOLD = '#CA8A04'

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-premium">
      <p className="mb-1 font-medium text-neutral-700">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-neutral-500">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium text-neutral-800">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function RevenueTrendChart({ data, height = 260 }: { data: RevenueTrendPoint[]; height?: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: GREEN }} /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: GOLD }} /> Storage Fees
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity={0.16} />
              <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="0" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#E2E8F0' }} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={GREEN}
            strokeWidth={2}
            fill="url(#revenueFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="storageFees"
            name="Storage Fees"
            stroke={GOLD}
            strokeWidth={2}
            fill="transparent"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
