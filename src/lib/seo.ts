interface SeoConfig {
  title: string
  description: string
}

const SITE_NAME = 'KeepXtra'

export function buildSeo({ title, description }: SeoConfig) {
  return {
    title: `${title} — ${SITE_NAME}`,
    description,
  }
}
