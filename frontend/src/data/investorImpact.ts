import { Leaf, ShieldCheck, TrendingUp, Globe2, type LucideIcon } from 'lucide-react'

export interface ImpactPillar {
  icon: LucideIcon
  title: string
  description: string
}

export const investorImpactPillars: ImpactPillar[] = [
  {
    icon: ShieldCheck,
    title: 'ESG',
    description: 'Governance and reporting built in from day one, not bolted on later.',
  },
  {
    icon: Globe2,
    title: 'Food Security',
    description: 'Less waste means more of every harvest actually reaches the people who need it.',
  },
  {
    icon: TrendingUp,
    title: 'Farmer Empowerment',
    description: 'Fair, consistent pricing and faster payment cycles for the farmers we work with.',
  },
  {
    icon: Leaf,
    title: 'Environmental Sustainability',
    description: 'Reducing spoilage cuts the emissions embedded in food that never gets eaten.',
  },
]
