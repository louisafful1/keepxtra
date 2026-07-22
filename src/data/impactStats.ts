import { Leaf, Users, Building2, Truck, type LucideIcon } from 'lucide-react'

export interface ImpactStat {
  value: number
  suffix?: string
  prefix?: string
  label: string
  icon: LucideIcon
  accent?: boolean
}

export const impactStats: ImpactStat[] = [
  { value: 2500, suffix: '+', label: 'Tonnes of food saved from waste', icon: Leaf },
  { value: 1200, suffix: '+', label: 'Farmers & traders supported', icon: Users },
  { value: 350, suffix: '+', label: 'Businesses served', icon: Building2 },
  { value: 40000, suffix: '+', label: 'Deliveries completed', icon: Truck, accent: true },
]
