import {
  Sprout,
  Truck,
  Warehouse,
  ShieldCheck,
  ClipboardList,
  Send,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface HowWeWorkStep {
  title: string
  description: string
  icon: LucideIcon
}

export const howWeWorkSteps: HowWeWorkStep[] = [
  {
    title: 'Farmers',
    description: 'Produce is sourced directly from partner farms and market traders at harvest.',
    icon: Sprout,
  },
  {
    title: 'Collection',
    description: 'Our logistics team picks up goods within hours, before quality begins to drop.',
    icon: Truck,
  },
  {
    title: 'Cold Storage',
    description: 'Produce moves into temperature-controlled facilities to lock in freshness.',
    icon: Warehouse,
  },
  {
    title: 'Quality Inspection',
    description: 'Every batch is graded and inspected against strict freshness standards.',
    icon: ShieldCheck,
  },
  {
    title: 'Inventory',
    description: 'Stock levels, shelf life, and location are tracked in real time.',
    icon: ClipboardList,
  },
  {
    title: 'Distribution',
    description: 'Orders are matched to inventory and routed across our delivery network.',
    icon: Send,
  },
  {
    title: 'Restaurants',
    description: 'Hotels, restaurants, and retailers receive consistent, quality-checked supply.',
    icon: UtensilsCrossed,
  },
  {
    title: 'Consumers',
    description: 'Fresh, affordable produce reaches households — with far less waste along the way.',
    icon: Users,
  },
]
