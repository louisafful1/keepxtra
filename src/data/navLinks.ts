export interface NavLink {
  label: string
  to: string
}

export const navLinks: NavLink[] = [
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Partners', to: '/partners' },
  { label: 'Investors', to: '/investors' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
]
