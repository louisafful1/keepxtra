import {
  Sprout,
  Store,
  UtensilsCrossed,
  Building2,
  ShoppingBag,
  School,
  HeartPulse,
  Factory,
  Ship,
  type LucideIcon,
} from 'lucide-react'

export interface PartnerSegment {
  icon: LucideIcon
  title: string
  description: string
  benefits: string[]
  image?: string
}

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=75&auto=format&fit=crop`

export const partnerSegments: PartnerSegment[] = [
  {
    icon: Sprout,
    title: 'Farmers',
    description: 'A guaranteed off-take partner for your harvest, with storage that protects its value.',
    benefits: ['Fair, consistent pricing', 'Cold storage access', 'Faster payment cycles'],
    image: unsplash('1605000797499-95a51c5269ae'),
  },
  {
    icon: Store,
    title: 'Market Women',
    description: 'Reliable bulk supply so you can sell with confidence, not guesswork.',
    benefits: ['Steady, quality-checked stock', 'Less unsold produce lost to spoilage', 'Wider buyer network'],
    image: unsplash('1488459716781-31db52582fe9'),
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurants',
    description: 'Consistent, quality-checked ingredients so your kitchen never has to compromise.',
    benefits: ['Predictable delivery schedules', 'Fewer last-minute sourcing gaps', 'Simplified ordering'],
    image: unsplash('1555396273-367ea4eb4db5'),
  },
  {
    icon: Building2,
    title: 'Hotels',
    description: 'Bulk supply agreements built for volume, with the reliability high-occupancy kitchens need.',
    benefits: ['Volume-based supply agreements', 'Dependable delivery windows', 'Quality assurance on every shipment'],
    image: unsplash('1621293954908-907159247fc8'),
  },
  {
    icon: ShoppingBag,
    title: 'Supermarkets',
    description: 'Shelf-ready produce and flexible restocking that keeps your shelves full and fresh.',
    benefits: ['Consistent quality grading', 'Flexible restocking schedules', 'Reduced in-store spoilage'],
    image: unsplash('1604719312566-8912e9227c6a'),
  },
  {
    icon: School,
    title: 'Schools',
    description: 'Affordable, reliable bulk produce that supports meal programs and nutrition goals.',
    benefits: ['Budget-friendly bulk pricing', 'Consistent supply for meal planning', 'Support for nutrition programs'],
    image: unsplash('1551218372-a8789b81b253'),
  },
  {
    icon: HeartPulse,
    title: 'Hospitals',
    description: 'Strict quality and hygiene standards for kitchens where reliability matters most.',
    benefits: ['Hygiene-first handling standards', 'Dependable delivery for patient meals', 'Recurring-order bulk pricing'],
    image: unsplash('1495433923968-85c6751d2df6'),
  },
  {
    icon: Factory,
    title: 'Food Processors',
    description: 'A steady stream of quality-graded raw material for your production lines.',
    benefits: ['Consistent raw material supply', 'Quality grading reduces production waste', 'Volume that scales with you'],
  },
  {
    icon: Ship,
    title: 'Exporters',
    description: 'Export-grade quality assurance and cold chain handling built for longer journeys.',
    benefits: ['Export-grade quality grading', 'Cold chain built for long transit', 'Reliable volume for order commitments'],
  },
]
