import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'KeepXtra'
const SITE_URL = 'https://www.keepxtra.com'
const DEFAULT_IMAGE = `${SITE_URL}/favicon-512.png`

interface SeoProps {
  /** Page title without the site name — "— KeepXtra" is appended automatically. */
  title: string
  description: string
  /** Route path beginning with "/", e.g. "/about". */
  path: string
  /** Absolute image URL for social sharing (defaults to the logo). */
  image?: string
  noIndex?: boolean
}

export function Seo({ title, description, path, image = DEFAULT_IMAGE, noIndex }: SeoProps) {
  const fullTitle = `${title} — ${SITE_NAME}`
  const url = `${SITE_URL}${path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
