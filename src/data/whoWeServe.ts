import {
  Sprout,
  Store,
  UtensilsCrossed,
  Building2,
  ShoppingBag,
  School,
  HeartPulse,
  Home,
  type LucideIcon,
} from 'lucide-react'

export interface Segment {
  icon: LucideIcon
  title: string
  image: string
}

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=75&auto=format&fit=crop`

export const segments: Segment[] = [
  { icon: Sprout, title: 'Farmers', image: unsplash('1605000797499-95a51c5269ae') },
  { icon: Store, title: 'Market Traders', image: unsplash('1488459716781-31db52582fe9') },
  { icon: UtensilsCrossed, title: 'Restaurants', image: unsplash('1555396273-367ea4eb4db5') },
  { icon: Building2, title: 'Hotels', image: unsplash('1621293954908-907159247fc8') },
  { icon: ShoppingBag, title: 'Retailers', image: unsplash('1604719312566-8912e9227c6a') },
  { icon: School, title: 'Schools', image: unsplash('1551218372-a8789b81b253') },
  { icon: HeartPulse, title: 'Hospitals', image: unsplash('1495433923968-85c6751d2df6') },
  { icon: Home, title: 'Households', image: unsplash('1760445529436-25510c869789') },
]
