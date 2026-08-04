import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { ServicesHero } from '@/sections/services/ServicesHero'
import { ServicesQuickNav } from '@/sections/services/ServicesQuickNav'
import { ServicesList } from '@/sections/services/ServicesList'
import { FinalCta } from '@/sections/home/FinalCta'

export default function ServicesPage() {
  const seo = buildSeo({
    title: 'Our Services',
    description:
      'Cold storage, inventory management, quality assurance, distribution, last-mile delivery, bulk supply, market access, warehouse management, and supply chain consulting — end-to-end infrastructure for fresh produce.',
  })

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <ServicesHero />
      <ServicesQuickNav />
      <ServicesList />
      <FinalCta />
    </>
  )
}
