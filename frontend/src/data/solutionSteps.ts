import {
  Sprout,
  Warehouse,
  ShieldCheck,
  ClipboardList,
  PackageSearch,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

export interface SolutionStep {
  index: string
  title: string
  description: string
  icon: LucideIcon
}

export const solutionSteps: SolutionStep[] = [
  {
    index: '01',
    title: 'Farmer',
    description: 'Produce is collected directly from partner farms and market traders at harvest.',
    icon: Sprout,
  },
  {
    index: '02',
    title: 'KeepXtra Storage',
    description: 'Goods move into temperature-controlled facilities within hours of pickup.',
    icon: Warehouse,
  },
  {
    index: '03',
    title: 'Quality Check',
    description: 'Every batch is graded and inspected against strict freshness standards.',
    icon: ShieldCheck,
  },
  {
    index: '04',
    title: 'Inventory',
    description: 'Stock levels, shelf life, and location are tracked in real time.',
    icon: ClipboardList,
  },
  {
    index: '05',
    title: 'Order Processing',
    description: 'Buyer orders are matched to available inventory and routed automatically.',
    icon: PackageSearch,
  },
  {
    index: '06',
    title: 'Delivery',
    description: 'Our logistics network moves produce out on optimized delivery routes.',
    icon: Truck,
  },
  {
    index: '07',
    title: 'Restaurant / Consumer',
    description: 'Fresh produce arrives at restaurants, retailers, and households — waste-free.',
    icon: UtensilsCrossed,
  },
]
