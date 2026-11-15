import 'server-only'
import { getDestinations, getTrips } from './data'
import { GUIDES, type Guide } from './destination-guides'
import type { Destination, TripWithDepartures } from './types'

export type DestinationSummary = {
  d: Destination
  guide: Guide | null
  trips: TripWithDepartures[]
  /** the cover photo: the destination's own, else its first trip's */
  cover: string | null
  nights: number
  /** lowest upcoming group-departure price, if any */
  fromPrice: number | null
  /** the soonest departure with seats */
  next: { date: string; city: string; price: number; trip: TripWithDepartures } | null
  startCities: string[]
  hasGroupTrip: boolean
}

function summarise(d: Destination, all: TripWithDepartures[]): DestinationSummary {
  const trips = all.filter((t) => t.destination?.slug === d.slug)
  const deps = trips.flatMap((t) => t.departures.filter((x) => x.seats_left > 0).map((x) => ({ ...x, trip: t })))
    .sort((a, b) => a.depart_date.localeCompare(b.depart_date))
  const withDeps = trips.filter((t) => t.departures.length)
  const lead = withDeps[0] ?? trips[0]
  return {
    d,
    guide: GUIDES[d.slug] ?? null,
    trips,
    cover: d.hero_image ?? lead?.image ?? d.gallery?.[0]?.src ?? null,
    nights: lead?.nights ?? d.default_nights,
    fromPrice: deps.length ? Math.min(...deps.map((x) => x.price)) : null,
    next: deps[0] ? { date: deps[0].depart_date, city: deps[0].start_city, price: deps[0].price, trip: deps[0].trip } : null,
    startCities: [...new Set(deps.map((x) => x.start_city))],
    hasGroupTrip: withDeps.length > 0,
  }
}

export async function getDestinationSummaries(): Promise<DestinationSummary[]> {
  const [dests, trips] = await Promise.all([getDestinations(), getTrips()])
  return dests.map((d) => summarise(d, trips))
}

export async function getDestinationSummary(slug: string): Promise<{ one: DestinationSummary; others: DestinationSummary[] } | null> {
  const all = await getDestinationSummaries()
  const one = all.find((s) => s.d.slug === slug)
  return one ? { one, others: all.filter((s) => s.d.slug !== slug) } : null
}
