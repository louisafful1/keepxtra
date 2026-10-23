import { Seo } from '@/components/Seo'
import { Hero } from '@/sections/home/Hero'
import { ProblemStats } from '@/sections/home/ProblemStats'
import { Services } from '@/sections/home/Services'
import { WhoWeServe } from '@/sections/home/WhoWeServe'
import { XtraStorePromo } from '@/sections/home/XtraStorePromo'
import { WhyKeepXtra } from '@/sections/home/WhyKeepXtra'
import { InvestorHighlight } from '@/sections/home/InvestorHighlight'
import { Sustainability } from '@/sections/home/Sustainability'
import { FinalCta } from '@/sections/home/FinalCta'

export default function HomePage() {
  return (
    <>
      <Seo
        title="Reducing Food Waste. Powering Africa's Fresh Produce Supply Chain"
        description="KeepXtra provides cold storage, quality assurance, inventory management, and logistics that connect farmers directly to restaurants, hotels, retailers, and households — cutting post-harvest loss across Africa."
        path="/"
      />
      <Hero />
      <ProblemStats />
      <Services />
      <WhoWeServe />
      <XtraStorePromo />
      <WhyKeepXtra />
      <InvestorHighlight />
      <Sustainability />
      <FinalCta />
    </>
  )
}
