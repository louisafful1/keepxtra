export interface NavLink {
  label: string
  to: string
  /** Match the path exactly — used for the root `/` link so it isn't active on every page. */
  end?: boolean
}

export const navLinks: NavLink[] = [
  { label: 'Home', to: '/', end: true },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Partners', to: '/partners' },
  { label: 'Investors', to: '/investors' },
  { label: 'Contact', to: '/contact' },
]
