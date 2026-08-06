import { Warehouse, Truck, Repeat, Handshake, Store, type LucideIcon } from 'lucide-react'

export interface BusinessModelStream {
  icon: LucideIcon
  title: string
  description: string
}

export const businessModelStreams: BusinessModelStream[] = [
  {
    icon: Warehouse,
    title: 'Storage Fees',
    description: 'Recurring fees for cold storage capacity used by farmers, traders, and buyers.',
  },
  {
    icon: Truck,
    title: 'Delivery Fees',
    description: 'Per-delivery and route-based fees for last-mile and bulk distribution.',
  },
  {
    icon: Repeat,
    title: 'Subscription Plans',
    description: 'Monthly plans giving businesses guaranteed storage and delivery capacity.',
  },
  {
    icon: Handshake,
    title: 'Enterprise Partnerships',
    description: 'Custom supply agreements with hotels, retailers, and institutions.',
  },
  {
    icon: Store,
    title: 'Marketplace Revenue',
    description: "A share of transactions made through KeepXtra's buyer-seller marketplace.",
  },
]
