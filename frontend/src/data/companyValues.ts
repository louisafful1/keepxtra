import { Lightbulb, ShieldCheck, Leaf, BadgeCheck, Users, Cpu, type LucideIcon } from 'lucide-react'

export interface CompanyValue {
  icon: LucideIcon
  title: string
  description: string
}

export const companyValues: CompanyValue[] = [
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We build practical technology that solves real, on-the-ground supply chain problems.',
  },
  {
    icon: ShieldCheck,
    title: 'Integrity',
    description: 'We do right by farmers, buyers, and each other — even when no one is watching.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description: 'Every process we design reduces waste and protects the systems we all depend on.',
  },
  {
    icon: BadgeCheck,
    title: 'Reliability',
    description: 'From cold storage to delivery, we show up consistently so our partners can depend on us.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'We grow by growing the people around us — farmers, traders, and local talent.',
  },
  {
    icon: Cpu,
    title: 'Technology',
    description: 'Data and automation sit behind every decision, from inventory to routing.',
  },
]
