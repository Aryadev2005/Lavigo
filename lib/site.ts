import 'server-only'
import { cache } from 'react'
import { BUSINESS } from './config'
import { TRIP_PHOTOS, type Photo } from './media'
import { dbConfigured, publicClient } from './supabase'
import type { Faq } from './types'

// Site content the owner edits in Admin → Site content. Anything not saved yet falls back to
// these defaults, so the site looks the same before and after the owner touches it.

export const DEFAULT_FAQ: Faq[] = [
  { q: 'Where do Lavigo trips start from?', a: 'From anywhere in India. Each group departure shows its starting city, and Lavigo can book your train or flight to it from your own city. Custom trips start from whichever city you choose.' },
  { q: 'Which destinations does Lavigo cover?', a: 'Nepal (Pokhara and Kathmandu), Darjeeling, Sikkim, Netarhat, Puri and Goa as fixed-date group trips, and anywhere in India or abroad as a custom private trip.' },
  { q: 'How do I book a group trip?', a: "Pick a departure on the trip page, add each traveller's name and gender, and choose whether Lavigo books your train or flight tickets. Your seats are held online, and you pay a 25% advance on WhatsApp to confirm. The balance is paid before you travel." },
  { q: 'How long are seats held before I pay?', a: 'Seats are held for 24 hours after you submit the booking form. If the advance is not paid in that time, the seats are released for other travellers.' },
  { q: 'Can I see the hotels and cars before I book?', a: 'Yes. Every trip page lists the hotels and cars used at the destination, along with what is and is not included. You can also download the full day-by-day itinerary as a PDF.' },
  { q: 'Can I plan a trip on my own dates?', a: 'Yes. Use the trip planner to choose your starting city, places, nights, hotel type, cars and activities. You see a day-by-day plan and an estimate, can download it as a PDF, and get the final quote on WhatsApp.' },
]

export type HomeContent = {
  topbar: string
  kicker: string
  headline: string
  subline: string
  faqs: Faq[]
  photos: Photo[]
  photosTitle: string
  photosText: string
}
export type BusinessContent = { email: string; gstin: string; address: string; instagram: string }
export type SiteContent = { home: HomeContent; business: BusinessContent }

export const DEFAULT_HOME: HomeContent = {
  topbar: 'Trips from anywhere in India · Nepal · Darjeeling · Sikkim · Netarhat · Puri · Goa',
  kicker: 'Group journeys and private holidays',
  headline: 'Trips from anywhere in India,\nplanned day by day.',
  subline: 'Fixed dates, small groups and a trip leader on every departure. Join from any city.',
  faqs: DEFAULT_FAQ,
  photos: TRIP_PHOTOS,
  photosTitle: 'From our last trip',
  photosText: 'Real Lavigo travellers, photographed on the road in Nepal.',
}
export const DEFAULT_BUSINESS: BusinessContent = { email: BUSINESS.email, gstin: BUSINESS.gstin, address: BUSINESS.address, instagram: BUSINESS.instagram }

const str = (v: unknown, d: string, max = 400) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : d)

function mergeHome(v: Record<string, unknown> | undefined): HomeContent {
  if (!v) return DEFAULT_HOME
  const faqs = Array.isArray(v.faqs) ? (v.faqs as Faq[]).filter((f) => f?.q && f?.a) : null
  const photos = Array.isArray(v.photos) ? (v.photos as Photo[]).filter((p) => p?.src) : null
  return {
    topbar: str(v.topbar, DEFAULT_HOME.topbar, 160),
    kicker: str(v.kicker, DEFAULT_HOME.kicker, 80),
    headline: str(v.headline, DEFAULT_HOME.headline, 120),
    subline: str(v.subline, DEFAULT_HOME.subline, 240),
    faqs: faqs && faqs.length ? faqs : DEFAULT_HOME.faqs,
    photos: photos && photos.length ? photos : DEFAULT_HOME.photos,
    photosTitle: str(v.photosTitle, DEFAULT_HOME.photosTitle, 80),
    photosText: str(v.photosText, DEFAULT_HOME.photosText, 200),
  }
}
function mergeBusiness(v: Record<string, unknown> | undefined): BusinessContent {
  if (!v) return DEFAULT_BUSINESS
  return {
    email: typeof v.email === 'string' ? v.email.trim().slice(0, 120) : DEFAULT_BUSINESS.email,
    gstin: typeof v.gstin === 'string' ? v.gstin.trim().toUpperCase().slice(0, 15) : DEFAULT_BUSINESS.gstin,
    address: str(v.address, DEFAULT_BUSINESS.address, 240),
    instagram: str(v.instagram, DEFAULT_BUSINESS.instagram, 200),
  }
}

/** Raw rows (used by the admin editor too). Never throws: before migration 006 the table doesn't exist. */
export async function readSettings(): Promise<Record<string, Record<string, unknown>>> {
  if (!dbConfigured) return {}
  try {
    const { data, error } = await publicClient().from('site_settings').select('key,value')
    if (error) return {}
    return Object.fromEntries((data ?? []).map((r) => [r.key as string, (r.value ?? {}) as Record<string, unknown>]))
  } catch {
    return {}
  }
}

export const getSite = cache(async (): Promise<SiteContent> => {
  const raw = await readSettings()
  return { home: mergeHome(raw.home), business: mergeBusiness(raw.business) }
})
