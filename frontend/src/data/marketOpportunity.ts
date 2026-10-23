export interface MarketMetric {
  label: string
  /** Headline value where we have a citable source; omit for qualitative drivers. */
  value?: string
  description: string
  trend?: number[]
  source?: string
}

export const marketOpportunity: MarketMetric[] = [
  {
    label: 'Population Growth',
    value: '~2x by 2050',
    description: "Africa's population is projected to nearly double, driving food demand.",
    source: 'UN World Population Prospects',
    trend: [30, 42, 55, 74, 100],
  },
  {
    label: 'Rising Urban Demand',
    description: 'Fast urbanisation concentrates demand for reliable, quality fresh food.',
  },
  {
    label: 'Cold-Chain Gap',
    description: 'Cold-storage and logistics capacity trail production, so produce spoils before sale.',
  },
  {
    label: 'Fragmented Supply Chain',
    description: 'Multiple informal intermediaries add cost and uncertainty to every transaction.',
  },
]
