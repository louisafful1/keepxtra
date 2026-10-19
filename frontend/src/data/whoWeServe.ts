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
  imageAlt: string
}

export const segments: Segment[] = [
  {
    icon: Sprout,
    title: 'Farmers',
    image: '/images/segments/farmers.jpg',
    imageAlt: 'Farmers bagging freshly harvested grain in northern Ghana',
  },
  {
    icon: Store,
    title: 'Market Traders',
    image: '/images/segments/market-traders.jpg',
    imageAlt: 'Market trader carrying a basket of fresh peppers in Accra',
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurants',
    image: '/images/segments/restaurants.jpg',
    imageAlt: 'Restaurant interior in Accra with carved Ghanaian wall art',
  },
  {
    icon: Building2,
    title: 'Hotels',
    image: '/images/segments/hotels.jpg',
    imageAlt: 'Hotel lodge entrance in Ada Foah, Ghana',
  },
  {
    icon: ShoppingBag,
    title: 'Retailers',
    image: '/images/segments/retailers.jpg',
    imageAlt: 'Produce vendor arranging tomatoes and greens at a Ghanaian market stall',
  },
  {
    icon: School,
    title: 'Schools',
    image: '/images/segments/schools.jpg',
    imageAlt: 'Schoolchildren in uniform outside a school in Ghana',
  },
  {
    icon: HeartPulse,
    title: 'Hospitals',
    image: '/images/segments/hospitals.jpg',
    imageAlt: 'Hospital ward room in Accra, Ghana',
  },
  {
    icon: Home,
    title: 'Households',
    image: '/images/segments/households.jpg',
    imageAlt: 'Women preparing a family meal outdoors in Ajumako, Central Ghana',
  },
]
