import { Link } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { NewsletterForm } from '@/components/layout/NewsletterForm'
import { footerLinkGroups, socialLinks } from '@/data/footerLinks'

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <Container className="py-20">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.4fr_2fr]">
          <div className="flex flex-col gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
                <Sprout className="size-5 text-white" strokeWidth={2} />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight text-neutral-900">
                KeepXtra
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
              Technology-driven logistics infrastructure reducing post-harvest food loss
              and powering Africa&apos;s fresh produce supply chain — from farm to
              storage to doorstep.
            </p>
            <div>
              <p className="mb-3 text-sm font-medium text-neutral-700">
                Get supply-chain insights in your inbox
              </p>
              <NewsletterForm />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {footerLinkGroups.map((group) => (
              <div key={group.title} className="flex flex-col gap-4">
                <p className="text-sm font-medium text-neutral-400">{group.title}</p>
                <ul className="flex flex-col gap-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-neutral-200 pt-8 sm:flex-row">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} KeepXtra. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-400 transition-colors hover:text-neutral-900"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  )
}
