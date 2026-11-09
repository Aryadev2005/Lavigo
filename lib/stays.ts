import stays from '@/data/stays.json'
import type { Car, Destination, Hotel, Tier } from './types'

type Catalog = Record<string, { hotels: Hotel[]; cars: Car[] }>
const CATALOG = stays as unknown as Catalog

export const TIER_LABEL: Record<Tier, string> = { budget: 'Budget', comfort: 'Comfort', premium: 'Premium' }

/** Hotels and cars saved on the destination, or the starter list until the owner adds his own. */
export function withStays<T extends Partial<Destination> & { slug: string }>(d: T): T & { hotels: Hotel[]; cars: Car[] } {
  const own = { hotels: Array.isArray(d.hotels) ? d.hotels : [], cars: Array.isArray(d.cars) ? d.cars : [] }
  const fb = CATALOG[d.slug]
  return { ...d, hotels: own.hotels.length ? own.hotels : fb?.hotels ?? [], cars: own.cars.length ? own.cars : fb?.cars ?? [] }
}

/** Cars that fit a group, smallest first; if none is big enough, the biggest one (several are booked). */
export function carsFor(cars: Car[], pax: number) {
  const sorted = [...cars].sort((a, b) => a.seats - b.seats)
  const fit = sorted.filter((c) => c.seats >= pax)
  return fit.length ? fit : sorted.slice(-1)
}

export function stars(n: number) {
  return n > 0 ? '★'.repeat(Math.min(5, Math.round(n))) : ''
}
