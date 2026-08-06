import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface TrendPoint {
  label: string
  value: number
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  color,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  valueFormatter: (value: number) => string
  color: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-premium">
      <p className="mb-1 font-medium text-neutral-700">{label}</p>
      <p className="flex items-center gap-1.5 text-neutral-500">
        <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-medium text-neutral-800">{valueFormatter(payload[0].value)}</span>
      </p>
    </div>
  )
}

interface TrendAreaChartProps {
  data: TrendPoint[]
  color?: string
  valueFormatter?: (value: number) => string
  height?: number
  gradientId: string
}

export function TrendAreaChart({ data, color = '#16A34A', valueFormatter = String, height = 220, gradientId }: TrendAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.16} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="0" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={8} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          width={36}
        />
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} color={color} />} cursor={{ stroke: '#E2E8F0' }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
