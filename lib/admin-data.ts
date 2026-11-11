import 'server-only'
import { adminClient } from './supabase'
import { withStays } from './stays'
import { todayISO } from './format'
import type { Booking, Departure, Destination, Gender, Passenger, Payment, Trip } from './types'

/* ───────────── shared shapes ───────────── */
export type BookingRow = Booking & { departure: { id: string; depart_date: string; start_city?: string; price: number; trip: { id: string; title: string; slug: string } } }
export type Traveller = { name: string; gender: Gender | null; lead: boolean; dob?: string; idChecked?: boolean }
export type GenderCount = { male: number; female: number; unknown: number }

const BOOKING_SELECT = '*, departure:departures(id, depart_date, start_city, price, trip:trips(id, title, slug))'

/** Active = holds that have not lapsed, plus confirmed bookings. These are the ones that take seats. */
export const isLiveHold = (b: Pick<Booking, 'status' | 'hold_expires_at'>) =>
  b.status === 'held' && !!b.hold_expires_at && new Date(b.hold_expires_at).getTime() > Date.now()
export const takesSeats = (b: Pick<Booking, 'status' | 'hold_expires_at'>) => b.status === 'confirmed' || isLiveHold(b)

/** Every traveller on a booking, with gender. Older bookings (before genders were asked) only have names. */
export function travellersOf(b: Pick<Booking, 'name' | 'travellers' | 'passengers' | 'other_names'>): Traveller[] {
  const p = (b.passengers ?? []) as Passenger[]
  if (p.length) return p.map((x, i) => ({ name: x.name, gender: x.gender, lead: i === 0, dob: x.dob, idChecked: x.id_checked }))
  // fallback: "Name (Male), Name (Female)" stored in other_names by the website before migration 005
  const others = (b.other_names ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const parsed = others.map((o) => {
    const m = o.match(/^(.*)\((male|female)\)\s*$/i)
    return m ? { name: m[1].trim(), gender: m[2].toLowerCase() as Gender, lead: false } : { name: o, gender: null, lead: false }
  })
  const list: Traveller[] = [{ name: b.name, gender: null, lead: true }, ...parsed]
  while (list.length < b.travellers) list.push({ name: `Traveller ${list.length + 1}`, gender: null, lead: false })
  return list.slice(0, b.travellers)
}
export function countGenders(bs: Pick<Booking, 'name' | 'travellers' | 'passengers' | 'other_names'>[]): GenderCount {
  const c = { male: 0, female: 0, unknown: 0 }
  for (const b of bs) for (const t of travellersOf(b)) c[t.gender ?? 'unknown']++
  return c
}

/* ───────────── bookings ───────────── */
export type BookingFilter = { status?: string; q?: string; departure?: string; trip?: string; source?: string; pay?: string }

export async function listBookings(f: BookingFilter): Promise<BookingRow[]> {
  let q = adminClient().from('bookings').select(BOOKING_SELECT).order('created_at', { ascending: false }).limit(500)
  const status = f.status || 'active'
  if (status === 'active') q = q.in('status', ['held', 'confirmed'])
  else if (status !== 'all') q = q.eq('status', status)
  if (f.departure) q = q.eq('departure_id', f.departure)
  if (f.source === 'admin' || f.source === 'website') q = q.eq('source', f.source)
  if (f.pay === 'unpaid' || f.pay === 'partial' || f.pay === 'paid' || f.pay === 'refunded') q = q.eq('payment_status', f.pay)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  let rows = (data ?? []) as unknown as BookingRow[]
  if (f.trip) rows = rows.filter((r) => r.departure?.trip?.id === f.trip)
  const term = (f.q ?? '').trim().toLowerCase()
  if (term) {
    const digits = term.replace(/\D/g, '')
    rows = rows.filter((r) =>
      r.code.toLowerCase().includes(term) ||
      (digits.length >= 3 && r.phone.includes(digits)) ||
      travellersOf(r).some((t) => t.name.toLowerCase().includes(term)) ||
      (r.email ?? '').toLowerCase().includes(term))
  }
  return rows
}

export async function getBooking(code: string) {
  const sb = adminClient()
  const { data, error } = await sb.from('bookings').select(BOOKING_SELECT).eq('code', code.toUpperCase()).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const b = data as unknown as BookingRow
  const pay = await sb.from('payments').select('*').eq('booking_id', b.id).order('created_at')
  const payments = pay.error ? null : ((pay.data ?? []) as Payment[]) // null = payment log not set up yet (migration 006)
  return { booking: b, payments }
}

/* ───────────── departures ───────────── */
export type DepartureStats = {
  confirmedSeats: number; heldSeats: number; seatsLeft: number
  genders: GenderCount; bookings: number
  revenue: number; received: number; due: number
}
export type DepartureRow = Departure & { trip: { id: string; title: string; slug: string; nights: number; published: boolean }; stats: DepartureStats }

function statsFor(d: Pick<Departure, 'seats_total'>, bks: Booking[]): DepartureStats {
  const live = bks.filter(takesSeats)
  const conf = live.filter((b) => b.status === 'confirmed')
  const confirmedSeats = conf.reduce((s, b) => s + b.travellers, 0)
  const heldSeats = live.filter(isLiveHold).reduce((s, b) => s + b.travellers, 0)
  return {
    confirmedSeats, heldSeats, seatsLeft: Math.max(0, d.seats_total - confirmedSeats - heldSeats),
    genders: countGenders(live), bookings: live.length,
    revenue: conf.reduce((s, b) => s + b.amount_total, 0),
    received: conf.reduce((s, b) => s + b.amount_paid, 0),
    due: conf.reduce((s, b) => s + Math.max(0, b.amount_total - b.amount_paid), 0),
  }
}

export async function listDepartures(when: 'upcoming' | 'past' | 'all' = 'upcoming'): Promise<DepartureRow[]> {
  const sb = adminClient()
  let q = sb.from('departures').select('*, trip:trips(id, title, slug, nights, published)').order('depart_date', { ascending: when !== 'past' })
  const today = todayISO()
  if (when === 'upcoming') q = q.gte('depart_date', today)
  if (when === 'past') q = q.lt('depart_date', today)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  const deps = (data ?? []) as unknown as (Departure & { trip: DepartureRow['trip'] })[]
  if (!deps.length) return []
  const { data: bk, error: e2 } = await sb.from('bookings').select('*').in('departure_id', deps.map((d) => d.id)).in('status', ['held', 'confirmed'])
  if (e2) throw new Error(e2.message)
  return deps.map((d) => ({ ...d, start_city: d.start_city || 'Ranchi', stats: statsFor(d, ((bk ?? []) as Booking[]).filter((b) => b.departure_id === d.id)) }))
}

export async function getDeparture(id: string) {
  const sb = adminClient()
  const { data, error } = await sb.from('departures').select('*, trip:trips(id, title, slug, nights, published, route)').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const dep = data as unknown as Departure & { trip: DepartureRow['trip'] & { route: string } }
  const { data: bk, error: e2 } = await sb.from('bookings').select('*').eq('departure_id', id).order('created_at')
  if (e2) throw new Error(e2.message)
  const bookings = (bk ?? []) as Booking[]
  return { departure: { ...dep, start_city: dep.start_city || 'Ranchi' }, bookings, stats: statsFor(dep, bookings) }
}

/** Open departures that still have seats, for "New booking" and "Move to another date". */
export async function bookableDepartures() {
  return (await listDepartures('upcoming')).filter((d) => d.status === 'open')
}

/* ───────────── overview ───────────── */
export async function overview() {
  const sb = adminClient()
  const { data, error } = await sb.from('bookings').select(BOOKING_SELECT).order('created_at', { ascending: false }).limit(1000)
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as BookingRow[]
  const today = todayISO()
  const now = Date.now()
  const in14 = new Date(now + 14 * 864e5).toISOString().slice(0, 10)
  const liveHolds = rows.filter(isLiveHold)
  const confirmed = rows.filter((b) => b.status === 'confirmed')
  const upcomingConf = confirmed.filter((b) => b.departure.depart_date >= today)
  const monthStart = today.slice(0, 7) + '-01'
  return {
    holds: liveHolds.length,
    heldSeats: liveHolds.reduce((s, b) => s + b.travellers, 0),
    heldValue: liveHolds.reduce((s, b) => s + b.amount_advance, 0),
    upcomingTravellers: upcomingConf.reduce((s, b) => s + b.travellers, 0),
    received: confirmed.reduce((s, b) => s + b.amount_paid, 0),
    receivedThisMonth: confirmed.filter((b) => (b.confirmed_at ?? b.created_at) >= monthStart).reduce((s, b) => s + b.amount_paid, 0),
    due: upcomingConf.reduce((s, b) => s + Math.max(0, b.amount_total - b.amount_paid), 0),
    expiringSoon: liveHolds.filter((b) => new Date(b.hold_expires_at!).getTime() - now < 6 * 3600e3)
      .sort((a, b) => a.hold_expires_at!.localeCompare(b.hold_expires_at!)),
    balanceSoon: upcomingConf.filter((b) => b.amount_paid < b.amount_total && b.departure.depart_date <= in14)
      .sort((a, b) => a.departure.depart_date.localeCompare(b.departure.depart_date)),
    recent: rows.slice(0, 8),
    newToday: rows.filter((b) => b.created_at.slice(0, 10) === today).length,
  }
}

/* ───────────── trips & destinations ───────────── */
export type AdminTrip = Trip & { departures: DepartureRow[]; destination: { name: string } | null }

export async function listTripsAdmin(): Promise<AdminTrip[]> {
  const sb = adminClient()
  const [{ data, error }, deps, { data: ds }] = await Promise.all([
    sb.from('trips').select('*').order('created_at', { ascending: false }),
    listDepartures('all'),
    sb.from('destinations').select('id,name'),
  ])
  if (error) throw new Error(error.message)
  const names = new Map((ds ?? []).map((d) => [d.id as string, d.name as string]))
  return ((data ?? []) as Trip[]).map((t) => ({
    ...t,
    destination: t.destination_id && names.has(t.destination_id) ? { name: names.get(t.destination_id)! } : null,
    departures: deps.filter((d) => d.trip_id === t.id).sort((a, b) => a.depart_date.localeCompare(b.depart_date)),
  }))
}
export async function getTripAdmin(id: string) {
  return (await listTripsAdmin()).find((t) => t.id === id) ?? null
}
export async function listDestinationsAdmin() {
  const { data, error } = await adminClient().from('destinations').select('*').order('sort_order')
  if (error) throw new Error(error.message)
  return (data ?? []) as Destination[]
}
export async function getDestinationAdmin(id: string) {
  const { data, error } = await adminClient().from('destinations').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? withStays(data as Destination) : null // starter hotels/cars until the owner saves his own
}
