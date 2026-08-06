import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'

export interface MagnitudeBarDatum {
  label: string
  value: number
}

interface MagnitudeBarChartProps {
  data: MagnitudeBarDatum[]
  valueFormatter?: (value: number) => string
  height?: number
  hueForIndex?: (index: number) => string
}

const DEFAULT_HUE = '#16A34A'

export function MagnitudeBarChart({ data, valueFormatter = String, height, hueForIndex }: MagnitudeBarChartProps) {
  const rowHeight = 40
  const chartHeight = height ?? Math.max(120, data.length * rowHeight)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap={14}>
        <CartesianGrid horizontal={false} stroke="#E2E8F0" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          axisLine={false}
          tickLine={false}
          width={130}
          tick={{ fill: '#475569', fontSize: 12.5 }}
        />
        <Bar dataKey="value" radius={[4, 4, 4, 4]} maxBarSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={hueForIndex ? hueForIndex(i) : DEFAULT_HUE} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(value) => valueFormatter(Number(value))}
            style={{ fill: '#334155', fontSize: 12.5, fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
