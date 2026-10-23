export interface ProblemMetric {
  label: string
  /** Percentage with a citable source; omit for qualitative challenges. */
  value?: number
  description: string
  source?: string
}

export const problemMetrics: ProblemMetric[] = [
  {
    label: 'Food Loss',
    value: 23,
    description: 'Food is lost in sub-Saharan Africa before it reaches retail.',
    source: 'FAO, SDG Indicator 12.3.1 (2024)',
  },
  {
    label: 'Fragmented Logistics',
    description: 'Informal, uncoordinated logistics raise costs and slow delivery.',
  },
  {
    label: 'Farmer Income',
    description: 'Spoilage and inefficiency erode the income farmers actually keep.',
  },
  {
    label: 'Supply Reliability',
    description: 'Buyers struggle to plan around inconsistent, unpredictable supply.',
  },
]
