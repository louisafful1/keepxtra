import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { ContactHero } from '@/sections/contact/ContactHero'
import { ContactInfoGrid } from '@/sections/contact/ContactInfoGrid'
import { ContactFormSection } from '@/sections/contact/ContactFormSection'

export default function ContactPage() {
  const seo = buildSeo({
    title: 'Contact Us',
    description:
      'Get in touch with KeepXtra — email, call, or WhatsApp our team, or send a message about partnerships, deliveries, or support.',
  })

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <ContactHero />
      <ContactInfoGrid />
      <ContactFormSection />
    </>
  )
}
