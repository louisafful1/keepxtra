/** A single, citable headline market statistic. */
export interface MarketStat {
  value: string
  label: string
  source: string
}

/** A qualitative market driver (no fabricated figures). */
export interface MarketDriver {
  title: string
  description: string
}

export const marketStat: MarketStat = {
  value: '~2x by 2050',
  label: "Africa's population is projected to nearly double, driving food demand.",
  source: 'UN World Population Prospects',
}

export const marketDrivers: MarketDriver[] = [
  {
    title: 'Rising Urban Demand',
    description: 'Fast urbanisation concentrates demand for reliable, quality fresh food.',
  },
  {
    title: 'Cold-Chain Gap',
    description: 'Cold-storage and logistics capacity trail production, so produce spoils before sale.',
  },
  {
    title: 'Fragmented Supply Chain',
    description: 'Multiple informal intermediaries add cost and uncertainty to every transaction.',
  },
]
