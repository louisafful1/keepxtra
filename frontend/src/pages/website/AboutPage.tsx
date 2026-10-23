import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { AboutHero } from '@/sections/about/AboutHero'
import { OurStory } from '@/sections/about/OurStory'
import { MissionSection } from '@/sections/about/MissionSection'
import { VisionSection } from '@/sections/about/VisionSection'
import { OurValues } from '@/sections/about/OurValues'
import { HowWeWork } from '@/sections/about/HowWeWork'
import { MeetTheTeam } from '@/sections/about/MeetTheTeam'
import { FinalCta } from '@/sections/home/FinalCta'

export default function AboutPage() {
  const seo = buildSeo({
    title: 'About Us',
    description:
      "KeepXtra's story, mission, and the team building the infrastructure reducing post-harvest food loss across Africa's fresh produce supply chain.",
  })

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <AboutHero />
      <OurStory />
      <MissionSection />
      <VisionSection />
      <OurValues />
      <HowWeWork />
      <MeetTheTeam />
      <FinalCta />
    </>
  )
}
