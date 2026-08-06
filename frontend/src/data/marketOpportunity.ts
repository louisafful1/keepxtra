export interface MarketMetric {
  label: string
  value: string
  description: string
  trend: number[]
}

export const marketOpportunity: MarketMetric[] = [
  {
    label: 'Addressable Market',
    value: '$4B+',
    description: "Annual value flowing through Africa's fresh produce supply chain.",
    trend: [30, 45, 60, 80, 100],
  },
  {
    label: 'Food Industry Growth',
    value: '+6%/yr',
    description: "Projected annual growth in Africa's food & beverage sector.",
    trend: [40, 50, 62, 78, 95],
  },
  {
    label: 'Urban Demand',
    value: '68%',
    description: "Share of Africa's population projected to live in cities by 2035.",
    trend: [35, 48, 58, 72, 90],
  },
  {
    label: 'Population Growth',
    value: '~2x by 2050',
    description: "Africa's population is projected to nearly double, driving food demand.",
    trend: [30, 42, 55, 74, 100],
  },
]
