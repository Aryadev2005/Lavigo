import 'server-only'
import { adminClient } from './supabase'
import type { Booking, Departure, Destination, Trip } from './types'

export type BookingRow = Booking & { departure: { depart_date: string; trip: { title: string; slug: string } } }

export async function listBookings(filter: string): Promise<BookingRow[]> {
  let q = adminClient()
    .from('bookings')
    .select('*, departure:departures(depart_date, trip:trips(title, slug))')
    .order('created_at', { ascending: false })
    .limit(300)
  if (filter === 'active') q = q.in('status', ['held', 'confirmed'])
  else if (filter !== 'all') q = q.eq('status', filter)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as BookingRow[]
}

export async function bookingStats() {
  const { data, error } = await adminClient().from('bookings').select('status,travellers,amount_paid,amount_total,hold_expires_at,departure:departures(depart_date)')
  if (error) throw new Error(error.message)
  const today = new Date().toISOString().slice(0, 10)
  const now = Date.now()
  let waiting = 0, waitingSeats = 0, confirmed = 0, seatsSold = 0, received = 0, balanceDue = 0
  for (const r of (data ?? []) as unknown as { status: string; travellers: number; amount_paid: number; amount_total: number; hold_expires_at: string | null; departure: { depart_date: string } }[]) {
    if (r.status === 'held' && r.hold_expires_at && new Date(r.hold_expires_at).getTime() > now) { waiting++; waitingSeats += r.travellers }
    if (r.status === 'confirmed') {
      confirmed++; received += r.amount_paid; balanceDue += Math.max(0, r.amount_total - r.amount_paid)
      if (r.departure.depart_date >= today) seatsSold += r.travellers
    }
  }
  return { waiting, waitingSeats, confirmed, seatsSold, received, balanceDue }
}

export type AdminDeparture = Departure & { taken: number; held: number }
export type AdminTrip = Trip & { departures: AdminDeparture[]; destination: { name: string } | null }

async function withDepartures(trips: Trip[]): Promise<AdminTrip[]> {
  const sb = adminClient()
  const ids = trips.map((t) => t.id)
  const { data: deps } = ids.length ? await sb.from('departures').select('*').in('trip_id', ids).order('depart_date') : { data: [] }
  const depIds = (deps ?? []).map((d) => d.id)
  const { data: bk } = depIds.length ? await sb.from('bookings').select('departure_id,status,travellers,hold_expires_at').in('departure_id', depIds) : { data: [] }
  const now = Date.now()
  const conf = new Map<string, number>(), held = new Map<string, number>()
  for (const b of bk ?? []) {
    if (b.status === 'confirmed') conf.set(b.departure_id, (conf.get(b.departure_id) ?? 0) + b.travellers)
    else if (b.status === 'held' && b.hold_expires_at && new Date(b.hold_expires_at).getTime() > now) held.set(b.departure_id, (held.get(b.departure_id) ?? 0) + b.travellers)
  }
  const dests = new Map<string, string>()
  const { data: ds } = await sb.from('destinations').select('id,name')
  for (const d of ds ?? []) dests.set(d.id, d.name)
  return trips.map((t) => ({
    ...t,
    destination: t.destination_id && dests.has(t.destination_id) ? { name: dests.get(t.destination_id)! } : null,
    departures: (deps ?? []).filter((d) => d.trip_id === t.id).map((d) => {
      const c = conf.get(d.id) ?? 0, h = held.get(d.id) ?? 0
      return { ...d, taken: c + h, held: h, seats_left: Math.max(0, d.seats_total - c - h) } as AdminDeparture
    }),
  }))
}

export async function listTripsAdmin() {
  const { data, error } = await adminClient().from('trips').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return withDepartures((data ?? []) as Trip[])
}
export async function getTripAdmin(id: string) {
  const { data, error } = await adminClient().from('trips').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? (await withDepartures([data as Trip]))[0] : null
}
export async function listDestinationsAdmin() {
  const { data, error } = await adminClient().from('destinations').select('*').order('sort_order')
  if (error) throw new Error(error.message)
  return (data ?? []) as Destination[]
}
export async function getDestinationAdmin(id: string) {
  const { data, error } = await adminClient().from('destinations').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return (data ?? null) as Destination | null
}
