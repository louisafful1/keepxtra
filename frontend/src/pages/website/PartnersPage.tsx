import { Seo } from '@/components/Seo'
import { PartnersHero } from '@/sections/partners/PartnersHero'
import { PartnerSegments } from '@/sections/partners/PartnerSegments'
import { PartnerBenefits } from '@/sections/partners/PartnerBenefits'
import { PartnershipProcess } from '@/sections/partners/PartnershipProcess'
import { FinalCta } from '@/sections/home/FinalCta'

export default function PartnersPage() {
  return (
    <>
      <Seo
        title="Partner With KeepXtra"
        description="KeepXtra partners with farmers, market women, restaurants, hotels, supermarkets, schools, hospitals, food processors, and exporters across the fresh produce supply chain."
        path="/partners"
      />
      <PartnersHero />
      <PartnerSegments />
      <PartnerBenefits />
      <PartnershipProcess />
      <FinalCta />
    </>
  )
}
