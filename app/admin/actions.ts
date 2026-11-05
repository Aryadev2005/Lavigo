'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { authClient, getAdmin, requireAdmin } from '@/lib/admin-auth'
import { slugify } from '@/lib/format'
import { adminClient } from '@/lib/supabase'

type R = { error?: string }
const refresh = () => revalidatePath('/', 'layout') // every public page picks up the change within seconds

/* ───────────── auth ───────────── */
export async function signIn(_p: R, fd: FormData): Promise<R> {
  const email = String(fd.get('email') || '').trim()
  const password = String(fd.get('password') || '')
  if (!email || !password) return { error: 'Enter your email and password.' }
  const sb = await authClient()
  const { error } = await sb.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Wrong email or password.' }
  if (!(await getAdmin())) { await sb.auth.signOut(); return { error: 'This account does not have admin access.' } }
  redirect('/admin')
}
export async function signOut() {
  await (await authClient()).auth.signOut()
  redirect('/admin/login')
}

/* ───────────── helpers ───────────── */
const int = (v: FormDataEntryValue | null, d = 0) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : d }
const lines = (v: FormDataEntryValue | null) => String(v || '').split('\n').map((s) => s.trim()).filter(Boolean)
function json<T>(v: FormDataEntryValue | null, fallback: T): T { try { return JSON.parse(String(v || '')) as T } catch { return fallback } }
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL
/** Only accept images we host: bundled /img/* files or our own Supabase Storage bucket. */
function cleanImage(v: unknown): string | null {
  const s = String(v || '').trim()
  if (!s) return null
  if (s.startsWith('/img/') && !s.includes('..')) return s
  if (SB && s.startsWith(`${SB}/storage/v1/object/public/`)) return s
  return null
}
function back(path: string, kind: 'err' | 'ok', msg: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}${kind}=${encodeURIComponent(msg)}`)
}

/* ───────────── bookings ───────────── */
const BOOKING_ERR: Record<string, string> = {
  seats_gone: 'Those seats were taken by someone else after the hold lapsed. Cancel this booking or free up seats first.',
  booking_cancelled: 'This booking was cancelled and cannot be confirmed.',
  booking_not_found: 'Booking not found.',
}
function bookingError(m: string) { const k = Object.keys(BOOKING_ERR).find((x) => m.includes(x)); return k ? BOOKING_ERR[k] : 'Something went wrong: ' + m }

export async function confirmBooking(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id'))
  const amount = int(fd.get('amount'), -1)
  if (amount < 0) back('/admin', 'err', 'Enter the amount received (0 if none yet).')
  const { error } = await adminClient().rpc('confirm_booking', { p_amount_paid: amount, p_booking: id })
  if (error) back('/admin', 'err', bookingError(error.message))
  refresh(); back('/admin', 'ok', 'Booking confirmed.')
}
export async function cancelBooking(fd: FormData) {
  await requireAdmin()
  const { error } = await adminClient().rpc('cancel_booking', { p_booking: String(fd.get('id')) })
  if (error) back('/admin', 'err', bookingError(error.message))
  refresh(); back('/admin', 'ok', 'Booking cancelled and seats released.')
}
export async function recordPayment(fd: FormData) {
  await requireAdmin()
  const amount = int(fd.get('amount'))
  if (amount <= 0) back('/admin', 'err', 'Enter a payment amount above 0.')
  const { error } = await adminClient().rpc('record_payment', { p_booking: String(fd.get('id')), p_amount: amount })
  if (error) back('/admin', 'err', bookingError(error.message))
  refresh(); back('/admin', 'ok', 'Payment recorded.')
}

/* ───────────── trips ───────────── */
export async function saveTrip(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') || '')
  const title = String(fd.get('title') || '').trim()
  const path = id ? `/admin/trips/${id}` : '/admin/trips/new'
  if (title.length < 3) back(path, 'err', 'Give the trip a title.')
  const nights = int(fd.get('nights'), -1)
  if (nights < 0 || nights > 30) back(path, 'err', 'Nights must be between 0 and 30.')
  const itinerary = json<{ title: string; text: string }[]>(fd.get('itinerary_json'), []).filter((d) => d.title?.trim()).map((d) => ({ title: d.title.trim(), text: (d.text || '').trim() }))
  const faqs = json<{ q: string; a: string }[]>(fd.get('faqs_json'), []).filter((f) => f.q?.trim() && f.a?.trim()).map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
  const row = {
    title,
    slug: slugify(String(fd.get('slug') || '') || title),
    destination_id: String(fd.get('destination_id') || '') || null,
    route: String(fd.get('route') || '').trim(),
    summary: String(fd.get('summary') || '').trim(),
    nights,
    image: cleanImage(fd.get('image')),
    itinerary,
    inclusions: lines(fd.get('inclusions')),
    exclusions: lines(fd.get('exclusions')),
    faqs,
    published: fd.get('published') === 'on',
  }
  if (!row.slug) back(path, 'err', 'The web address (slug) cannot be empty.')
  const sb = adminClient()
  const res = id ? await sb.from('trips').update(row).eq('id', id).select('id').single() : await sb.from('trips').insert(row).select('id').single()
  if (res.error) back(path, 'err', res.error.code === '23505' ? 'Another trip already uses that web address. Change the slug.' : 'Could not save: ' + res.error.message)
  refresh()
  back(`/admin/trips/${res.data!.id}`, 'ok', 'Trip saved.')
}

export async function deleteTrip(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id'))
  const sb = adminClient()
  const { data: deps } = await sb.from('departures').select('id').eq('trip_id', id)
  const ids = (deps ?? []).map((d) => d.id)
  if (ids.length) {
    const { count } = await sb.from('bookings').select('id', { count: 'exact', head: true }).in('departure_id', ids)
    if (count) back(`/admin/trips/${id}`, 'err', 'This trip has bookings, so it cannot be deleted. Untick "Show on website" to hide it instead.')
  }
  const { error } = await sb.from('trips').delete().eq('id', id)
  if (error) back(`/admin/trips/${id}`, 'err', 'Could not delete: ' + error.message)
  refresh(); back('/admin/trips', 'ok', 'Trip deleted.')
}

/* ───────────── departures (date + price + seats) ───────────── */
export async function saveDeparture(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') || '')
  const tripId = String(fd.get('trip_id'))
  const path = `/admin/trips/${tripId}`
  const date = String(fd.get('depart_date') || '')
  const price = int(fd.get('price'), -1)
  const seats = int(fd.get('seats_total'), -1)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) back(path, 'err', 'Pick a departure date.')
  if (price < 0) back(path, 'err', 'Enter the price per person.')
  if (seats < 0 || seats > 500) back(path, 'err', 'Enter the total number of seats.')
  const status = fd.get('status') === 'closed' ? 'closed' : 'open'
  const sb = adminClient()
  if (id) {
    const { data: taken } = await sb.rpc('seats_taken', { p_departure: id })
    if (seats < Number(taken ?? 0)) back(path, 'err', `${taken} seats are already booked or held, so the total cannot go below ${taken}.`)
    const { error } = await sb.from('departures').update({ depart_date: date, price, seats_total: seats, status }).eq('id', id)
    if (error) back(path, 'err', 'Could not save: ' + error.message)
  } else {
    const { error } = await sb.from('departures').insert({ trip_id: tripId, depart_date: date, price, seats_total: seats, status })
    if (error) back(path, 'err', 'Could not add: ' + error.message)
  }
  refresh(); back(path, 'ok', id ? 'Departure updated.' : 'Departure added.')
}

export async function deleteDeparture(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id'))
  const path = `/admin/trips/${String(fd.get('trip_id'))}`
  const sb = adminClient()
  const { count } = await sb.from('bookings').select('id', { count: 'exact', head: true }).eq('departure_id', id)
  if (count) back(path, 'err', 'This departure has bookings, so it cannot be deleted. Set it to Closed instead.')
  const { error } = await sb.from('departures').delete().eq('id', id)
  if (error) back(path, 'err', 'Could not delete: ' + error.message)
  refresh(); back(path, 'ok', 'Departure deleted.')
}

/* ───────────── destinations / planner rate card ───────────── */
export async function saveDestination(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') || '')
  const name = String(fd.get('name') || '').trim()
  const path = id ? `/admin/destinations/${id}` : '/admin/destinations/new'
  if (name.length < 2) back(path, 'err', 'Enter a destination name.')
  const used = new Set<string>()
  const activities = json<{ n: string; p: number | string; where: string }[]>(fd.get('activities_json'), [])
    .filter((a) => a.n?.trim())
    .map((a) => { let aid = slugify(a.n).slice(0, 30) || 'act'; while (used.has(aid)) aid += '2'; used.add(aid); return { id: aid, n: a.n.trim(), p: Math.max(0, int(String(a.p))), where: (a.where || name).trim() } })
  const gallery = json<{ src: string; caption: string }[]>(fd.get('gallery_json'), [])
    .map((g) => ({ src: cleanImage(g.src), caption: (g.caption || '').trim() })).filter((g) => g.src)
  const row = {
    name,
    slug: slugify(String(fd.get('slug') || '') || name),
    area: String(fd.get('area') || '').trim(),
    blurb: String(fd.get('blurb') || '').trim(),
    hero_image: cleanImage(fd.get('hero_image')),
    gallery,
    default_nights: Math.min(30, Math.max(1, int(fd.get('default_nights'), 3))),
    places: String(fd.get('places') || '').split(',').map((s) => s.trim()).filter(Boolean),
    rate_budget: Math.max(0, int(fd.get('rate_budget'))), rate_comfort: Math.max(0, int(fd.get('rate_comfort'))), rate_premium: Math.max(0, int(fd.get('rate_premium'))),
    travel_train: Math.max(0, int(fd.get('travel_train'))), travel_cab: Math.max(0, int(fd.get('travel_cab'))), travel_flight: Math.max(0, int(fd.get('travel_flight'))),
    activities,
    published: fd.get('published') === 'on',
  }
  const sb = adminClient()
  const res = id ? await sb.from('destinations').update(row).eq('id', id).select('id').single() : await sb.from('destinations').insert(row).select('id').single()
  if (res.error) back(path, 'err', res.error.code === '23505' ? 'Another destination uses that slug.' : 'Could not save: ' + res.error.message)
  refresh(); back(`/admin/destinations/${res.data!.id}`, 'ok', 'Destination saved.')
}

/* ───────────── image upload (called from the browser, already downscaled) ───────────── */
export async function uploadImage(fd: FormData): Promise<{ url?: string; error?: string }> {
  if (!(await getAdmin())) return { error: 'Please sign in again.' }
  const file = fd.get('file')
  if (!(file instanceof File) || !file.size) return { error: 'Choose a photo.' }
  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[file.type]
  if (!ext) return { error: 'Use a JPG, PNG or WebP photo.' }
  if (file.size > 3 * 1024 * 1024) return { error: 'That photo is too large (max 3 MB).' }
  const path = `${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const sb = adminClient()
  const { error } = await sb.storage.from('media').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, cacheControl: '31536000' })
  if (error) return { error: 'Upload failed: ' + error.message }
  return { url: sb.storage.from('media').getPublicUrl(path).data.publicUrl }
}
