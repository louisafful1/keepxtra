import {
  Sprout,
  Cpu,
  Snowflake,
  Truck,
  Recycle,
  Users,
  TrendingUp,
  Leaf,
  type LucideIcon,
} from 'lucide-react'

export const blogCategories = [
  'Agriculture',
  'Technology',
  'Cold Storage',
  'Supply Chain',
  'Food Waste',
  'Farmer Stories',
  'Business',
  'Sustainability',
] as const

export type BlogCategory = (typeof blogCategories)[number]

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: BlogCategory
  icon: LucideIcon
  author: string
  date: string
  readingTime: string
  featured?: boolean
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'why-africa-loses-40-percent-of-its-harvest',
    title: "Why Africa Loses 40% of Its Harvest Before It Reaches a Buyer",
    excerpt:
      'Post-harvest loss is not a farming problem — it’s an infrastructure problem. A look at where the food actually disappears along the way.',
    category: 'Food Waste',
    icon: Recycle,
    author: 'Louis Afful',
    date: '2026-07-14',
    readingTime: '6 min read',
    featured: true,
  },
  {
    slug: 'inside-a-cold-chain',
    title: 'Inside a Cold Chain: How Temperature Control Changes Everything',
    excerpt:
      'A few degrees can be the difference between a week of shelf life and a day. Here’s what a real cold chain looks like in practice.',
    category: 'Cold Storage',
    icon: Snowflake,
    author: 'Dennis Konadu',
    date: '2026-06-28',
    readingTime: '5 min read',
  },
  {
    slug: 'hidden-cost-of-fragmented-logistics',
    title: 'The Hidden Cost of Fragmented Logistics',
    excerpt:
      'Every extra handoff between farm and buyer adds cost, time, and risk. Why consolidating the chain pays off for everyone in it.',
    category: 'Supply Chain',
    icon: Truck,
    author: 'Joseph Maison',
    date: '2026-06-10',
    readingTime: '4 min read',
  },
  {
    slug: 'traders-story-cutting-losses-in-half',
    title: "A Trader's Story: Cutting Losses in Half in One Season",
    excerpt:
      'One market trader on what changed after moving her stock through proper cold storage instead of open-air holding.',
    category: 'Farmer Stories',
    icon: Users,
    author: 'Hamilton Maison',
    date: '2026-05-22',
    readingTime: '5 min read',
  },
  {
    slug: 'technology-quietly-fixing-food-system',
    title: "How Technology Is Quietly Fixing Africa's Food System",
    excerpt:
      'Real-time inventory, route optimization, and quality tracking are unglamorous — and they are exactly what has been missing.',
    category: 'Technology',
    icon: Cpu,
    author: 'Louis Afful',
    date: '2026-05-05',
    readingTime: '6 min read',
  },
  {
    slug: 'reliable-storage-missing-link',
    title: "Why Reliable Storage Is the Missing Link in African Agriculture",
    excerpt:
      'Good harvests already exist. What’s missing is somewhere safe for that harvest to sit while it finds a buyer.',
    category: 'Agriculture',
    icon: Sprout,
    author: 'Dennis Konadu',
    date: '2026-04-18',
    readingTime: '5 min read',
  },
  {
    slug: 'business-case-for-cold-storage-infrastructure',
    title: 'The Business Case for Investing in Cold Storage Infrastructure',
    excerpt:
      'Cold storage looks like a cost center until you measure what it prevents. A look at the economics behind the investment.',
    category: 'Business',
    icon: TrendingUp,
    author: 'Joseph Maison',
    date: '2026-04-02',
    readingTime: '7 min read',
  },
  {
    slug: 'reducing-food-waste-is-a-climate-strategy',
    title: 'Reducing Food Waste Is a Climate Strategy, Not Just an Efficiency One',
    excerpt:
      'Food that spoils before it’s eaten carries a real environmental cost. Cutting waste is quietly one of the highest-leverage climate actions available.',
    category: 'Sustainability',
    icon: Leaf,
    author: 'Hamilton Maison',
    date: '2026-03-19',
    readingTime: '5 min read',
  },
  {
    slug: 'moving-perishable-goods-safely-across-a-city',
    title: 'What It Takes to Move Perishable Goods Safely Across a City',
    excerpt:
      'Routing, timing, and handling all have to line up. A behind-the-scenes look at last-mile delivery for fresh produce.',
    category: 'Supply Chain',
    icon: Truck,
    author: 'Dennis Konadu',
    date: '2026-03-01',
    readingTime: '4 min read',
  },
  {
    slug: 'meet-the-farmers-powering-our-network',
    title: "Meet the Farmers Powering KeepXtra's Network",
    excerpt:
      'Behind every delivery is a farmer who took a chance on a more reliable way to sell their harvest. A few of their stories.',
    category: 'Farmer Stories',
    icon: Users,
    author: 'Louis Afful',
    date: '2026-02-12',
    readingTime: '6 min read',
  },
]
