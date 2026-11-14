import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config'
import { getPosts } from '@/lib/content'
import { getTrips } from '@/lib/data'

export const revalidate = 3600

// Every public page that should appear in Google. Private pages (admin, bookings, account, login,
// itinerary printouts) stay out and are also blocked in robots.ts / marked noindex.
// lastModified is only given where the date is real (blog posts); Google ignores a lastmod that
// changes on every build, so the other pages leave it out.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trips, posts] = await Promise.all([getTrips(), getPosts().catch(() => [])])
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']) =>
    ({ url: `${SITE_URL}${path}`, changeFrequency, priority })
  return [
    page('/', 1, 'weekly'),
    page('/trips', 0.9, 'daily'),
    ...trips.map((t) => page(`/trips/${t.slug}`, 0.8, 'weekly')),
    page('/plan', 0.7, 'monthly'),
    page('/blog', 0.7, 'weekly'),
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.published_at ?? p.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    page('/about', 0.6, 'monthly'),
    page('/reviews', 0.6, 'weekly'),
    page('/privacy', 0.2, 'yearly'),
    page('/terms', 0.2, 'yearly'),
    page('/refund-policy', 0.2, 'yearly'),
  ]
}
