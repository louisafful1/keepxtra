export interface ProblemMetric {
  label: string
  value: number
  description: string
}

export const problemMetrics: ProblemMetric[] = [
  {
    label: 'Food Waste',
    value: 40,
    description: 'Of harvested produce is lost before it ever reaches a buyer.',
  },
  {
    label: 'Poor Logistics',
    value: 35,
    description: 'Of supply chain cost is lost to fragmented, informal logistics.',
  },
  {
    label: 'Farmer Income',
    value: 30,
    description: 'Of potential farmer income is lost to spoilage and inefficiency.',
  },
  {
    label: 'Supply Shortages',
    value: 60,
    description: 'Of buyers report frequent, unpredictable supply shortages.',
  },
]
