import { Seo } from '@/components/Seo'
import { ContactHero } from '@/sections/contact/ContactHero'
import { ContactInfoGrid } from '@/sections/contact/ContactInfoGrid'
import { ContactFormSection } from '@/sections/contact/ContactFormSection'

export default function ContactPage() {
  return (
    <>
      <Seo
        title="Contact Us"
        description="Get in touch with KeepXtra — email, call, or WhatsApp our team, or send a message about partnerships, deliveries, or support."
        path="/contact"
      />
      <ContactHero />
      <ContactInfoGrid />
      <ContactFormSection />
    </>
  )
}
