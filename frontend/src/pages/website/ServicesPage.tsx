import { Seo } from '@/components/Seo'
import { ServicesHero } from '@/sections/services/ServicesHero'
import { ServicesQuickNav } from '@/sections/services/ServicesQuickNav'
import { ServicesList } from '@/sections/services/ServicesList'
import { FinalCta } from '@/sections/home/FinalCta'

export default function ServicesPage() {
  return (
    <>
      <Seo
        title="Our Services"
        description="Cold storage, inventory management, quality assurance, distribution, last-mile delivery, bulk supply, market access, warehouse management, and supply chain consulting — end-to-end infrastructure for fresh produce."
        path="/services"
      />
      <ServicesHero />
      <ServicesQuickNav />
      <ServicesList />
      <FinalCta />
    </>
  )
}
