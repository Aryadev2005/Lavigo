import 'server-only'
import seed from '@/data/seed.json'
import { dbConfigured, publicClient } from './supabase'
import { todayISO } from './format'
import { withStays } from './stays'
import type { Departure, Destination, TripWithDepartures } from './types'

/* ---------- demo mode (no Supabase env): serve the seed so the site still renders ---------- */
function demoDestinations(): Destination[] {
  return seed.destinations.map((d, i) => withStays({
    ...(d as unknown as Destination),
    id: 'demo-dest-' + d.slug,
    gallery: d.gallery ?? [],
    published: true,
    sort_order: i,
  }))
}
function demoTrips(): TripWithDepartures[] {
  const dests = demoDestinations()
  const today = todayISO()
  return seed.trips.map((t) => {
    const dest = dests.find((d) => d.slug === t.destination) ?? null
    const id = 'demo-trip-' + t.slug
    const departures: Departure[] = seed.departures
      .filter((d) => d.trip === t.slug && d.depart_date >= today)
      .map((d, i) => ({
        id: `demo-dep-${t.slug}-${i}`,
        trip_id: id,
        depart_date: d.depart_date,
        price: d.price,
        seats_total: d.seats_total,
        seats_left: d.seats_total,
        status: 'open' as const,
        start_city: (d as { start_city?: string }).start_city ?? 'Ranchi',
      }))
    return {
      id,
      slug: t.slug,
      destination_id: dest?.id ?? null,
      title: t.title,
      route: t.route,
      summary: t.summary,
      nights: t.nights,
      image: t.image,
      itinerary: t.itinerary,
      inclusions: t.inclusions,
      exclusions: t.exclusions,
      faqs: t.faqs,
      published: true,
      destination: dest ? { slug: dest.slug, name: dest.name, theme: dest.theme } : null,
      departures,
    }
  })
}

/* ---------- reads ---------- */
export async function getDestinations(): Promise<Destination[]> {
  if (!dbConfigured) return demoDestinations()
  const { data, error } = await publicClient()
    .from('destinations')
    .select('*')
    .eq('published', true)
    .order('sort_order')
  if (error) throw new Error('getDestinations: ' + error.message)
  return ((data ?? []) as Destination[]).map(withStays)
}

export async function getTrips(): Promise<TripWithDepartures[]> {
  if (!dbConfigured) return sortTrips(demoTrips())
  const sb = publicClient()
  const { data: trips, error } = await sb
    .from('trips')
    .select('*, destination:destinations(slug,name,theme)')
    .eq('published', true)
  if (error) throw new Error('getTrips: ' + error.message)
  const ids = (trips ?? []).map((t) => t.id)
  const { data: deps, error: e2 } = ids.length
    ? await sb
        .from('departures_public')
        .select('*')
        .in('trip_id', ids)
        .gte('depart_date', todayISO())
        .eq('status', 'open')
        .order('depart_date')
    : { data: [], error: null }
  if (e2) throw new Error('getTrips departures: ' + e2.message)
  const byTrip = new Map<string, Departure[]>()
  for (const raw of (deps ?? []) as Departure[]) {
    const d = { ...raw, start_city: raw.start_city || 'Ranchi' } // column arrives with migration 005
    byTrip.set(d.trip_id, [...(byTrip.get(d.trip_id) ?? []), d])
  }
  return sortTrips(
    (trips ?? []).map((t) => ({ ...(t as object), departures: byTrip.get(t.id) ?? [] }) as TripWithDepartures),
  )
}

// trips with an upcoming departure first (soonest first), the rest after
function sortTrips(trips: TripWithDepartures[]) {
  return [...trips].sort((a, b) => {
    const da = a.departures[0]?.depart_date ?? '9999'
    const db = b.departures[0]?.depart_date ?? '9999'
    return da.localeCompare(db)
  })
}

export async function getTripBySlug(slug: string) {
  return (await getTrips()).find((t) => t.slug === slug) ?? null
}
