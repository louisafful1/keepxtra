import {
  Snowflake,
  ClipboardList,
  ShieldCheck,
  Truck,
  Package,
  Store,
  Bike,
  type LucideIcon,
} from 'lucide-react'

export interface Service {
  icon: LucideIcon
  title: string
  description: string
}

export const services: Service[] = [
  {
    icon: Snowflake,
    title: 'Cold Storage',
    description:
      'Temperature-controlled facilities that extend shelf life and preserve freshness from day one.',
  },
  {
    icon: ClipboardList,
    title: 'Inventory Management',
    description:
      'Real-time visibility into stock levels, shelf life, and location across every facility.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Assurance',
    description:
      'Every batch is graded and inspected against strict freshness and safety standards.',
  },
  {
    icon: Truck,
    title: 'Distribution',
    description:
      'A logistics network built to move perishable goods quickly, safely, and reliably.',
  },
  {
    icon: Package,
    title: 'Bulk Supply',
    description:
      'Consistent, large-volume produce supply for restaurants, retailers, and institutions.',
  },
  {
    icon: Store,
    title: 'Market Access',
    description:
      'Direct connections between farmers and buyers — cutting out inefficient middle layers.',
  },
  {
    icon: Bike,
    title: 'Delivery',
    description:
      'Optimized last-mile delivery that gets fresh produce to its destination on time.',
  },
]
