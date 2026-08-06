export interface Testimonial {
  quote: string
  name: string
  role: string
  rating: number
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "KeepXtra changed how we plan our menu. We no longer worry about running out of fresh produce mid-week — deliveries are consistent and quality is always there.",
    name: 'Amara Ofori',
    role: 'Executive Chef, Savanna Bistro',
    rating: 5,
  },
  {
    quote:
      'Before KeepXtra, I lost almost a third of my harvest to spoilage. Now my produce goes straight into storage and I get paid for what I actually grow.',
    name: 'Kwame Asante',
    role: 'Farmer, Greenfield Farms',
    rating: 5,
  },
  {
    quote:
      'Our procurement process used to take days of calls and negotiation. With KeepXtra it takes minutes, and the quality is far more consistent.',
    name: 'Fatima Bello',
    role: 'Procurement Manager, Baobab Hotels',
    rating: 4,
  },
  {
    quote:
      'The visibility into inventory and delivery timing has made our supply chain predictable for the first time in years.',
    name: 'Daniel Mensah',
    role: 'Operations Lead, Metro Retail',
    rating: 5,
  },
]
