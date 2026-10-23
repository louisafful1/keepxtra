import { Seo } from '@/components/Seo'
import { InvestorsHero } from '@/sections/investors/InvestorsHero'
import { ProblemCharts } from '@/sections/investors/ProblemCharts'
import { OurSolutionPillars } from '@/sections/investors/OurSolutionPillars'
import { MarketOpportunity } from '@/sections/investors/MarketOpportunity'
import { BusinessModelSection } from '@/sections/investors/BusinessModelSection'
import { GrowthStrategySection } from '@/sections/investors/GrowthStrategySection'
import { ImpactEsgSection } from '@/sections/investors/ImpactEsgSection'
import { InvestorRoadmapSection } from '@/sections/investors/InvestorRoadmapSection'
import { InvestorFaqSection } from '@/sections/investors/InvestorFaqSection'
import { InvestorCta } from '@/sections/investors/InvestorCta'

export default function InvestorsPage() {
  return (
    <>
      <Seo
        title="Investor Relations"
        description="Market opportunity, business model, growth strategy, and roadmap for KeepXtra's fresh produce logistics infrastructure across Africa."
        path="/investors"
      />
      <InvestorsHero />
      <ProblemCharts />
      <OurSolutionPillars />
      <MarketOpportunity />
      <BusinessModelSection />
      <GrowthStrategySection />
      <ImpactEsgSection />
      <InvestorRoadmapSection />
      <InvestorFaqSection />
      <InvestorCta />
    </>
  )
}
