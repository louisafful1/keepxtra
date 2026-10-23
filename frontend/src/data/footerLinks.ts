export interface FooterLinkGroup {
  title: string
  links: { label: string; to: string }[]
}

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Cold Storage', to: '/services' },
      { label: 'Distribution & Delivery', to: '/services' },
      { label: 'Quality Assurance', to: '/services' },
      { label: 'Market Access', to: '/services' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Partners', to: '/partners' },
      { label: 'Investor Relations', to: '/investors' },
      { label: 'Contact', to: '/contact' },
    ],
  },
]

export const socialLinks = [
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'X (Twitter)', href: 'https://x.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
]
