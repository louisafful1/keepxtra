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
  { value: 0, label: 'Tonnes of food saved from waste', icon: Leaf },
  { value: 0, label: 'Farmers supported', icon: Users },
  { value: 0, label: 'Businesses served', icon: Building2 },
  { value: 0, label: 'Deliveries completed', icon: Truck, accent: true },
]
