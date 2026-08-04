import { Helmet } from 'react-helmet-async'
import { Clock, Mail, MessageCircle, Phone } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { contactEmail, contactNumbers, workingHours } from '@/data/contactInfo'

export default function SupportPage() {
  const seo = buildSeo({ title: 'Support', description: 'Get help from the KeepXtra team.' })

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Support" description="Need help with a pickup, payment, or your account? Reach us directly." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <a
          href={`mailto:${contactEmail}`}
          className="flex flex-col gap-3 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft transition-shadow hover:shadow-premium"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Mail className="size-4.5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-medium text-neutral-900">Email</p>
            <p className="text-sm text-neutral-500">{contactEmail}</p>
          </div>
        </a>

        <a
          href={contactNumbers[0].tel}
          className="flex flex-col gap-3 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft transition-shadow hover:shadow-premium"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Phone className="size-4.5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-medium text-neutral-900">Call us</p>
            <p className="text-sm text-neutral-500">{contactNumbers.map((n) => n.label).join(' / ')}</p>
          </div>
        </a>

        <a
          href={contactNumbers[0].whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-3 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft transition-shadow hover:shadow-premium"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <MessageCircle className="size-4.5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-medium text-neutral-900">WhatsApp</p>
            <p className="text-sm text-neutral-500">{contactNumbers[0].label}</p>
          </div>
        </a>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/70 bg-neutral-50 p-5 text-sm text-neutral-600">
        <Clock className="size-4.5 shrink-0 text-neutral-400" />
        Our support line is open {workingHours}.
      </div>
    </div>
  )
}
