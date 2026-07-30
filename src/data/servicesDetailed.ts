import {
  Snowflake,
  ClipboardList,
  ShieldCheck,
  Truck,
  Bike,
  Package,
  Store,
  Warehouse,
  Compass,
  type LucideIcon,
} from 'lucide-react'

export interface ServiceDetail {
  id: string
  icon: LucideIcon
  title: string
  description: string
  benefits: string[]
}

export const servicesDetailed: ServiceDetail[] = [
  {
    id: 'cold-storage',
    icon: Snowflake,
    title: 'Cold Storage',
    description:
      'Temperature-controlled facilities that lock in freshness the moment produce arrives — extending shelf life and cutting spoilage before it starts.',
    benefits: [
      'Extended shelf life for perishable produce',
      'Consistent temperature and humidity control',
      'Reduced spoilage and post-harvest loss',
      'Facilities positioned close to farms and markets',
    ],
  },
  {
    id: 'inventory-management',
    icon: ClipboardList,
    title: 'Inventory Management',
    description:
      'Real-time visibility into stock levels, shelf life, and location across every facility — so nothing sits too long or gets lost in the system.',
    benefits: [
      'Live stock tracking across all facilities',
      'Automated shelf-life and expiry alerts',
      'Fewer stockouts and overstock situations',
      'Data-driven restocking decisions',
    ],
  },
  {
    id: 'quality-assurance',
    icon: ShieldCheck,
    title: 'Quality Assurance',
    description:
      'Every batch is graded and inspected against strict freshness and safety standards before it ever reaches a buyer.',
    benefits: [
      'Consistent grading standards across batches',
      'Reduced returns and customer complaints',
      'Traceable quality records per shipment',
      'Higher buyer trust and repeat business',
    ],
  },
  {
    id: 'distribution',
    icon: Truck,
    title: 'Distribution',
    description:
      'A logistics network engineered specifically for perishable goods — built for speed, temperature control, and reliability.',
    benefits: [
      'Routes optimized for perishable cargo',
      'Temperature-controlled transport',
      'Reduced transit time from storage to buyer',
      'Reliable, scheduled distribution cycles',
    ],
  },
  {
    id: 'last-mile-delivery',
    icon: Bike,
    title: 'Last Mile Delivery',
    description:
      'The final, most fragile leg of the journey — handled with a dedicated fleet and routes built to protect freshness all the way to the door.',
    benefits: [
      'On-time, scheduled delivery windows',
      'Dedicated last-mile fleet',
      'Real-time delivery tracking',
      'Consistent supply for daily operations',
    ],
  },
  {
    id: 'bulk-supply',
    icon: Package,
    title: 'Bulk Supply',
    description:
      "Consistent, large-volume produce supply for restaurants, retailers, and institutions that can't afford to run out.",
    benefits: [
      'Predictable, high-volume order fulfillment',
      'Pricing built for scale',
      'Dedicated account support',
      'Flexible recurring supply schedules',
    ],
  },
  {
    id: 'market-access',
    icon: Store,
    title: 'Market Access',
    description:
      'Direct connections between farmers and buyers — cutting out inefficient middle layers that eat into margins on both ends.',
    benefits: [
      'Fair pricing for farmers and traders',
      'Direct buyer-seller relationships',
      'Expanded market reach for producers',
      'Fewer informal middlemen in the chain',
    ],
  },
  {
    id: 'warehouse-management',
    icon: Warehouse,
    title: 'Warehouse Management',
    description:
      'Purpose-built warehouse operations that keep produce organized, safe, and ready to move at a moment’s notice.',
    benefits: [
      'Optimized storage layouts by product type',
      'Strict hygiene and safety protocols',
      'Efficient inbound and outbound handling',
      'Scalable capacity as demand grows',
    ],
  },
  {
    id: 'supply-chain-consulting',
    icon: Compass,
    title: 'Supply Chain Consulting',
    description:
      'Hands-on guidance for farms, cooperatives, and businesses looking to reduce loss and build more resilient food supply operations.',
    benefits: [
      'Supply chain audits and loss assessments',
      'Custom recommendations for storage and logistics',
      'Training for farm and cooperative teams',
      'Ongoing advisory support',
    ],
  },
]
