/** A single, citable headline problem statistic. */
export interface ProblemStat {
  value: string
  label: string
  source: string
}

/** A qualitative structural challenge (no fabricated percentages). */
export interface ProblemChallenge {
  title: string
  description: string
}

export const problemStat: ProblemStat = {
  value: '23%',
  label: 'of food is lost in sub-Saharan Africa before it reaches retail.',
  source: 'FAO, SDG Indicator 12.3.1 (2024)',
}

export const problemChallenges: ProblemChallenge[] = [
  {
    title: 'Fragmented Logistics',
    description: 'Informal, uncoordinated logistics raise costs and slow delivery.',
  },
  {
    title: 'Farmer Income',
    description: 'Spoilage and inefficiency erode the income farmers actually keep.',
  },
  {
    title: 'Supply Reliability',
    description: 'Buyers struggle to plan around inconsistent, unpredictable supply.',
  },
  {
    title: 'Cold-Chain Gap',
    description: 'Storage and refrigeration capacity trail production, so produce spoils before sale.',
  },
]
