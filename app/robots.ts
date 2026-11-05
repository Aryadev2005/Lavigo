import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  if (process.env.ALLOW_INDEXING !== 'true') return { rules: { userAgent: '*', disallow: '/' } } // pre-launch: keep everything out
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/booking/', '/my-bookings', '/api/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
