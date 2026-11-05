import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config'
import { getTrips } from '@/lib/data'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const trips = await getTrips()
  const now = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/trips`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/plan`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    ...trips.map((t) => ({ url: `${SITE_URL}/trips/${t.slug}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 })),
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/refund-policy`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
