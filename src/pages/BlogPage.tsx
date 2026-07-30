import { Helmet } from 'react-helmet-async'
import { buildSeo } from '@/lib/seo'
import { BlogHero } from '@/sections/blog/BlogHero'
import { BlogBrowser } from '@/sections/blog/BlogBrowser'
import { BlogNewsletterSection } from '@/sections/blog/BlogNewsletterSection'

export default function BlogPage() {
  const seo = buildSeo({
    title: 'KeepXtra Journal',
    description:
      'Insights on post-harvest loss, cold storage, supply chain logistics, and farmer stories from across the KeepXtra network.',
  })

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <BlogHero />
      <BlogBrowser />
      <BlogNewsletterSection />
    </>
  )
}
