import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { PartnersHero } from '@/sections/partners/PartnersHero'
import { PartnerSegments } from '@/sections/partners/PartnerSegments'
import { PartnerBenefits } from '@/sections/partners/PartnerBenefits'
import { PartnershipProcess } from '@/sections/partners/PartnershipProcess'
import { FinalCta } from '@/sections/home/FinalCta'

export default function PartnersPage() {
  const seo = buildSeo({
    title: 'Partner With KeepXtra',
    description:
      'KeepXtra partners with farmers, market women, restaurants, hotels, supermarkets, schools, hospitals, food processors, and exporters across the fresh produce supply chain.',
  })

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PartnersHero />
      <PartnerSegments />
      <PartnerBenefits />
      <PartnershipProcess />
      <FinalCta />
    </>
  )
}
