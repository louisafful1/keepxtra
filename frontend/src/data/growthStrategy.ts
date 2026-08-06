import { MapPin, Warehouse, Snowflake, Cpu, type LucideIcon } from 'lucide-react'

export interface GrowthStrategyStep {
  icon: LucideIcon
  title: string
  description: string
}

export const growthStrategySteps: GrowthStrategyStep[] = [
  {
    icon: MapPin,
    title: 'Expand City by City',
    description: 'Deepen density in each city before expanding, so service quality never dilutes.',
  },
  {
    icon: Warehouse,
    title: 'Build Logistics Hubs',
    description: 'Establish regional hubs that shorten collection and delivery routes.',
  },
  {
    icon: Snowflake,
    title: 'Increase Cold Storage',
    description: 'Grow storage capacity ahead of demand to keep onboarding new partners.',
  },
  {
    icon: Cpu,
    title: 'Develop Technology Platform',
    description: 'Invest in the software layer that makes the network faster and smarter.',
  },
]
