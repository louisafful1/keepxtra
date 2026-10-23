import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { Hero } from '@/sections/home/Hero'
import { TrustBar } from '@/sections/home/TrustBar'
import { ProblemStats } from '@/sections/home/ProblemStats'
import { Services } from '@/sections/home/Services'
import { WhoWeServe } from '@/sections/home/WhoWeServe'
import { WhyKeepXtra } from '@/sections/home/WhyKeepXtra'
import { InvestorHighlight } from '@/sections/home/InvestorHighlight'
import { Sustainability } from '@/sections/home/Sustainability'
import { Testimonials } from '@/sections/home/Testimonials'
import { FinalCta } from '@/sections/home/FinalCta'

export default function HomePage() {
  const seo = buildSeo({
    title: "Reducing Food Waste. Powering Africa's Fresh Produce Supply Chain",
    description:
      'KeepXtra provides cold storage, quality assurance, inventory management, and logistics that connect farmers directly to restaurants, hotels, retailers, and households — cutting post-harvest loss across Africa.',
  })

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <Hero />
      <TrustBar />
      <ProblemStats />
      <Services />
      <WhoWeServe />
      <WhyKeepXtra />
      <InvestorHighlight />
      <Sustainability />
      <Testimonials />
      <FinalCta />
    </>
  )
}
