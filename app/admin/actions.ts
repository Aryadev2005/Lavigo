'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { authClient, getAdmin, requireAdmin } from '@/lib/admin-auth'
import { slugify } from '@/lib/format'
import { SUPABASE_URL } from '@/lib/env'
import { HOLD_HOURS } from '@/lib/config'
import { adminClient } from '@/lib/supabase'
import type { Gender, PayMethod } from '@/lib/types'

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
  if (!(await getAdmin())) { await sb.auth.signOut(); return { error: 'This account does not have admin access. Ask your developer to add the email to ADMIN_EMAILS.' } }
  redirect('/admin')
}
export async function signOut() {
  await (await authClient()).auth.signOut()
  redirect('/admin/login')
}

/* ───────────── helpers ───────────── */
const int = (v: FormDataEntryValue | null, d = 0) => { const n = Math.round(Number(String(v ?? '').replace(/[,₹\s]/g, ''))); return Number.isFinite(n) && String(v ?? '').trim() !== '' ? n : d }
const text = (v: FormDataEntryValue | null, max = 2000) => String(v ?? '').trim().slice(0, max)
const lines = (v: FormDataEntryValue | null) => String(v || '').split('\n').map((s) => s.trim()).filter(Boolean)
function json<T>(v: FormDataEntryValue | null, fallback: T): T { try { return JSON.parse(String(v || '')) as T } catch { return fallback } }
const SB = SUPABASE_URL
/** Only accept images we host: bundled /img/* or /video/* files, or our own Supabase Storage bucket. */
function cleanImage(v: unknown): string | null {
  const s = String(v || '').trim()
  if (!s) return null
  if ((s.startsWith('/img/') || s.startsWith('/video/')) && !s.includes('..')) return s
  if (SB && s.startsWith(`${SB}/storage/v1/object/public/`)) return s
  return null
}
const cleanGallery = (v: FormDataEntryValue | null) =>
  json<{ src: string; caption: string; wide?: string | boolean }[]>(v, [])
    .map((g) => ({ src: cleanImage(g.src), caption: text(g.caption ?? '', 140), ...(g.wide === true || g.wide === 'yes' ? { wide: true } : {}) }))
    .filter((g): g is { src: string; caption: string; wide?: true } => !!g.src)
    .slice(0, 40)

/** Where to send the owner afterwards: the page the form came from (always inside /admin). */
function backTo(fd: FormData, fallback: string) {
  const b = String(fd.get('back') || '')
  return b.startsWith('/admin') && !b.startsWith('//') ? b : fallback
}
function back(path: string, kind: 'err' | 'ok', msg: string): never {
  const [base, hash] = path.split('#')
  const clean = base.replace(/([?&])(ok|err)=[^&]*/g, '$1').replace(/[?&]+$/, '').replace(/\?&/, '?')
  redirect(`${clean}${clean.includes('?') ? '&' : '?'}${kind}=${encodeURIComponent(msg)}${hash ? '#' + hash : ''}`)
}
const missingFn = (e: { code?: string; message: string }) => e.code === 'PGRST202' || /could not find the function/i.test(e.message)
const NEEDS_006 = 'This needs the latest database update. Run supabase/migrations/006_admin_console.sql in Supabase, then try again.'
const NEEDS_008 = 'This needs the latest database update. Run supabase/migrations/008_accounts_reviews_blog.sql in Supabase, then try again.'

const ERR: Record<string, string> = {
  seats_gone: 'Those seats have been taken by someone else since the hold lapsed. Free up seats or cancel this booking.',
  booking_cancelled: 'This booking is cancelled, so it cannot be changed.',
  booking_not_found: 'Booking not found.',
  already_confirmed: 'This booking is already confirmed. Use "Record a payment" for further amounts.',
  not_confirmed: 'Payments can only be recorded on confirmed bookings (refunds also work on cancelled ones).',
  refund_too_large: 'The refund is more than what was paid.',
  total_below_paid: 'The new total is less than what the customer has already paid. Record a refund first.',
  overpaid: 'That is more than the balance due.',
  not_held: 'Only bookings that are on hold (or whose hold lapsed) can be given more time.',
  not_enough_seats: 'There are not enough seats left on that departure.',
  departure_past: 'That departure date has already passed.',
  departure_closed: 'That departure is closed for booking.',
  departure_not_found: 'Departure not found.',
  bad_phone: 'Enter a 10-digit Indian mobile number.',
  bad_name: 'Enter the full name of every traveller.',
  bad_gender: 'Choose male or female for every traveller.',
  bad_travellers: 'A booking needs between 1 and 20 travellers.',
  bad_ticket_by: 'Choose who books the train or flight tickets.',
  bad_amount: 'Enter a valid amount.',
  bad_hours: 'Choose between 1 hour and 14 days.',
}
function friendly(m: string) {
  const k = Object.keys(ERR).find((x) => m.includes(x))
  if (!k) return 'Something went wrong: ' + m
  const n = m.match(/:(\d+)/)?.[1]
  if (k === 'not_enough_seats' && n) return `Only ${n} seat${n === '1' ? '' : 's'} left on that departure.`
  if (k === 'overpaid' && n) return `That is more than the balance due (₹${Number(n).toLocaleString('en-IN')}).`
  if (k === 'total_below_paid' && n) return `The total cannot be less than the ₹${Number(n).toLocaleString('en-IN')} already paid. Record a refund first.`
  return ERR[k]
}
const METHODS: PayMethod[] = ['upi', 'cash', 'bank', 'card', 'other']
const method = (v: FormDataEntryValue | null): PayMethod => (METHODS.includes(String(v) as PayMethod) ? (String(v) as PayMethod) : 'upi')

function readPassengers(fd: FormData) {
  const names = fd.getAll('pax_name').map((v) => String(v).trim().replace(/\s+/g, ' ').slice(0, 80))
  const genders = fd.getAll('pax_gender').map((v) => String(v))
  const dobs = fd.getAll('pax_dob').map((v) => String(v).trim())
  const ids = fd.getAll('pax_id').map((v) => String(v) === 'yes')
  return names
    .map((name, i) => ({ name, gender: genders[i] as Gender, ...(/^\d{4}-\d{2}-\d{2}$/.test(dobs[i] || '') ? { dob: dobs[i] } : {}), ...(ids[i] ? { id_checked: true } : {}) }))
    .filter((p) => p.name)
}

/* ───────────── bookings ───────────── */
export async function confirmBooking(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id'))
  const to = backTo(fd, '/admin/bookings')
  const amount = int(fd.get('amount'), -1)
  if (amount < 0) back(to, 'err', 'Enter the amount received (0 if nothing yet).')
  const sb = adminClient()
  let { error } = await sb.rpc('admin_confirm', { p_booking: id, p_amount: amount, p_method: method(fd.get('method')), p_note: text(fd.get('note'), 200) || null })
  if (error && missingFn(error)) ({ error } = await sb.rpc('confirm_booking', { p_booking: id, p_amount_paid: amount }))
  if (error) back(to, 'err', friendly(error.message))
  refresh(); back(to, 'ok', 'Booking confirmed.' + (amount > 0 ? ` ₹${amount.toLocaleString('en-IN')} recorded.` : ''))
}

export async function cancelBooking(fd: FormData) {
  await requireAdmin()
  const to = backTo(fd, '/admin/bookings')
  const { error } = await adminClient().rpc('cancel_booking', { p_booking: String(fd.get('id')) })
  if (error) back(to, 'err', friendly(error.message))
  refresh(); back(to, 'ok', 'Booking cancelled and seats released. Record a refund below if money was returned.')
}

export async function addPayment(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id'))
  const to = backTo(fd, '/admin/bookings')
  const refund = fd.get('kind') === 'refund'
  const amount = int(fd.get('amount'))
  if (amount <= 0) back(to, 'err', 'Enter an amount above 0.')
  const sb = adminClient()
  let { error } = await sb.rpc('add_payment', { p_booking: id, p_amount: refund ? -amount : amount, p_method: method(fd.get('method')), p_note: text(fd.get('note'), 200) || null })
  if (error && missingFn(error)) {
    if (refund) back(to, 'err', NEEDS_006)
    ;({ error } = await sb.rpc('record_payment', { p_booking: id, p_amount: amount }))
  }
  if (error) back(to, 'err', friendly(error.message))
  refresh(); back(to, 'ok', refund ? `Refund of ₹${amount.toLocaleString('en-IN')} recorded.` : `Payment of ₹${amount.toLocaleString('en-IN')} recorded.`)
}

export async function extendHold(fd: FormData) {
  await requireAdmin()
  const to = backTo(fd, '/admin/bookings')
  const hours = int(fd.get('hours'), 24)
  const { error } = await adminClient().rpc('extend_hold', { p_booking: String(fd.get('id')), p_hours: hours })
  if (error) back(to, 'err', missingFn(error) ? NEEDS_006 : friendly(error.message))
  refresh(); back(to, 'ok', `Hold extended by ${hours >= 24 && hours % 24 === 0 ? `${hours / 24} day${hours === 24 ? '' : 's'}` : `${hours} hours`}.`)
}

export async function updateBooking(fd: FormData) {
  await requireAdmin()
  const to = backTo(fd, '/admin/bookings')
  const pax = readPassengers(fd)
  if (!pax.length) back(to, 'err', 'Add at least one traveller.')
  const ticket = fd.get('ticket_by') === 'self' ? 'self' : 'agency'
  const totalRaw = String(fd.get('amount_total') ?? '').trim()
  const { error } = await adminClient().rpc('update_booking', {
    p_booking: String(fd.get('id')),
    p_phone: String(fd.get('phone') || '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, ''),
    p_email: text(fd.get('email'), 120) || null,
    p_passengers: pax,
    p_ticket_by: ticket,
    p_from_city: ticket === 'agency' ? text(fd.get('from_city'), 60) || null : null,
    p_note: text(fd.get('admin_note'), 1000) || null,
    p_amount_total: totalRaw === '' ? null : int(totalRaw),
  })
  if (error) back(to, 'err', missingFn(error) ? NEEDS_006 : friendly(error.message))
  refresh(); back(to, 'ok', 'Booking updated.')
}

export async function moveBooking(fd: FormData) {
  await requireAdmin()
  const to = backTo(fd, '/admin/bookings')
  const dep = String(fd.get('departure_id') || '')
  if (!dep) back(to, 'err', 'Choose the new departure.')
  const { error } = await adminClient().rpc('move_booking', { p_booking: String(fd.get('id')), p_departure: dep })
  if (error) back(to, 'err', missingFn(error) ? NEEDS_006 : friendly(error.message))
  refresh(); back(to, 'ok', 'Moved to the new date. The price stays as agreed; edit the total below if it should change.')
}

export async function createBooking(fd: FormData) {
  await requireAdmin()
  const to = '/admin/bookings/new'
  const pax = readPassengers(fd)
  const dep = String(fd.get('departure_id') || '')
  if (!dep) back(to, 'err', 'Choose a departure.')
  if (!pax.length) back(to, 'err', 'Add at least one traveller.')
  const ticket = fd.get('ticket_by') === 'self' ? 'self' : 'agency'
  const confirm = fd.get('confirm') === 'on'
  const priceRaw = String(fd.get('price') ?? '').trim()
  const { data, error } = await adminClient().rpc('admin_create_booking', {
    p_departure: dep,
    p_phone: String(fd.get('phone') || '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, ''),
    p_email: text(fd.get('email'), 120) || null,
    p_passengers: pax,
    p_ticket_by: ticket,
    p_from_city: ticket === 'agency' ? text(fd.get('from_city'), 60) || null : null,
    p_note: text(fd.get('admin_note'), 1000) || null,
    p_confirm: confirm,
    p_amount_paid: confirm ? Math.max(0, int(fd.get('amount'))) : 0,
    p_method: method(fd.get('method')),
    p_price_per_person: priceRaw === '' ? null : Math.max(0, int(priceRaw)),
    p_hold_minutes: HOLD_HOURS * 60,
  })
  if (error) back(to, 'err', missingFn(error) ? NEEDS_006 : friendly(error.message))
  const code = (data as { code: string }).code
  refresh(); back(`/admin/bookings/${code}`, 'ok', confirm ? `Booking ${code} created and confirmed.` : `Booking ${code} created. Seats are held for ${HOLD_HOURS} hours.`)
}

/* ───────────── trips ───────────── */
export async function saveTrip(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') || '')
  const title = text(fd.get('title'), 120)
  const path = id ? `/admin/trips/${id}` : '/admin/trips/new'
  if (title.length < 3) back(path, 'err', 'Give the trip a title.')
  const nights = int(fd.get('nights'), -1)
  if (nights < 0 || nights > 30) back(path, 'err', 'Nights must be between 0 and 30.')
  const itinerary = json<{ title: string; description?: string; meals?: string; stay?: string; travel?: string; highlights?: string; image?: string }[]>(fd.get('itinerary_json'), [])
    .filter((d) => d.title?.trim())
    .map((d) => {
      const img = cleanImage(d.image)
      const description = (d.description || '').trim()
      const highlights = lines(d.highlights ?? null)
      return {
        title: d.title.trim(),
        description, // old readers fall back to `text`, which only exists on trips saved before this form changed
        ...(d.meals?.trim() ? { meals: d.meals.trim().slice(0, 20) } : {}),
        ...(d.stay?.trim() ? { stay: d.stay.trim().slice(0, 80) } : {}),
        ...(d.travel?.trim() ? { travel: d.travel.trim().slice(0, 80) } : {}),
        ...(highlights.length ? { highlights: highlights.slice(0, 10) } : {}),
        ...(img ? { image: img } : {}),
      }
    })
  const faqs = json<{ q: string; a: string }[]>(fd.get('faqs_json'), []).filter((f) => f.q?.trim() && f.a?.trim()).map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
  const sb0 = adminClient()
  // a brand-new place typed in the trip form: create the destination first
  let destinationId = String(fd.get('destination_id') || '') || null
  const newDest = text(fd.get('new_destination'), 60)
  let createdDest = false
  if (destinationId === 'new') {
    if (newDest.length < 2) back(path, 'err', 'Type the name of the new destination, or pick one from the list.')
    const { data: d, error: de } = await sb0.from('destinations').insert({ name: newDest, slug: slugify(newDest), area: text(fd.get('new_destination_area'), 80), default_nights: Math.max(1, nights), published: true }).select('id').single()
    if (de) back(path, 'err', de.code === '23505' ? `A destination called "${newDest}" already exists. Pick it from the list.` : 'Could not create the destination: ' + de.message)
    destinationId = d!.id as string
    createdDest = true
  }
  const row = {
    title,
    slug: slugify(String(fd.get('slug') || '') || title),
    destination_id: destinationId,
    route: text(fd.get('route'), 200),
    summary: text(fd.get('summary'), 600),
    nights,
    image: cleanImage(fd.get('image')),
    itinerary,
    inclusions: lines(fd.get('inclusions')),
    exclusions: lines(fd.get('exclusions')),
    faqs,
    published: fd.get('published') === 'on',
  }
  if (!row.slug) back(path, 'err', 'The web address (slug) cannot be empty.')
  const gallery = cleanGallery(fd.get('gallery_json'))
  const story = {
    story: text(fd.get('story'), 8000),
    highlights: json<{ text: string }[]>(fd.get('highlights_json'), []).filter((h) => h.text?.trim()).map((h) => h.text.trim().slice(0, 140)).slice(0, 20),
    places: json<{ name: string; about: string; image?: string }[]>(fd.get('places_json'), [])
      .filter((p) => p.name?.trim())
      .map((p) => { const img = cleanImage(p.image); return { name: p.name.trim().slice(0, 80), about: (p.about || '').trim().slice(0, 600), ...(img ? { image: img } : {}) } }),
    good_to_know: json<{ title: string; text: string }[]>(fd.get('good_to_know_json'), []).filter((g) => g.title?.trim() && g.text?.trim()).map((g) => ({ title: g.title.trim().slice(0, 80), text: g.text.trim().slice(0, 600) })),
    things_to_carry: lines(fd.get('things_to_carry')).slice(0, 40),
  }
  const tiers = ['budget', 'comfort', 'premium']
  const extra = {
    kind: fd.get('kind') === 'weekend' ? 'weekend' : 'group',
    itinerary_pdf: cleanImage(fd.get('itinerary_pdf')),
    hotels: json<Record<string, string>[]>(fd.get('trip_hotels_json'), [])
      .filter((h) => h.name?.trim())
      .map((h) => { const img = cleanImage(h.image); return { name: h.name.trim().slice(0, 80), place: (h.place || '').trim().slice(0, 60), tier: tiers.includes(h.tier) ? h.tier : 'comfort', stars: Math.min(5, Math.max(0, int(h.stars))), note: (h.note || '').trim().slice(0, 160), ...(img ? { image: img } : {}) } }),
    cars: json<Record<string, string>[]>(fd.get('trip_cars_json'), [])
      .filter((c) => c.name?.trim())
      .map((c) => { const img = cleanImage(c.image); return { name: c.name.trim().slice(0, 80), kind: (c.kind || '').trim().slice(0, 40), seats: Math.min(60, Math.max(1, int(c.seats, 4))), note: (c.note || '').trim().slice(0, 160), ...(img ? { image: img } : {}) } }),
  }
  const sb = sb0
  // photos of the place itself (the destination), edited from the trip form
  const destFor = String(fd.get('dest_gallery_for') || '')
  if (fd.has('dest_gallery_json') && destinationId && (destFor === destinationId || (createdDest && !destFor))) {
    const g = cleanGallery(fd.get('dest_gallery_json'))
    const upd: Record<string, unknown> = { gallery: g }
    if (createdDest && g[0]) upd.hero_image = g[0].src
    await sb.from('destinations').update(upd).eq('id', destinationId)
  }
  const save = (r: object) => (id ? sb.from('trips').update(r).eq('id', id).select('id').single() : sb.from('trips').insert(r).select('id').single())
  const col008 = (e: { message: string } | null) => !!e && /itinerary_pdf|hotels|cars|kind/.test(e.message) && /column/i.test(e.message)
  const storyColumnMissing = (e: { message: string } | null) => !!e && /story|highlights|good_to_know|things_to_carry|places/.test(e.message) && /column/i.test(e.message)
  let res = await save({ ...row, gallery, ...story, ...extra })
  let note = id ? 'Trip saved. The website updates within a minute.' : 'Trip created. Now add its departure dates below.'
  if (createdDest) note += ` New destination "${newDest}" created.`
  if (res.error && col008(res.error)) {
    res = await save({ ...row, gallery, ...story })
    note = 'Saved, but the trip type, PDF itinerary, hotels and cars need the latest database update (008_accounts_reviews_blog.sql).'
  }
  if (res.error && storyColumnMissing(res.error)) {
    res = await save({ ...row, gallery })
    note = 'Saved, but the story, places and good-to-know fields need the latest database update (007_trip_story.sql).'
  }
  if (res.error && /gallery/.test(res.error.message) && /column/i.test(res.error.message)) {
    res = await save(row)
    note = 'Saved, but the trip photo gallery needs the latest database update (006_admin_console.sql).'
  }
  if (res.error) back(path, 'err', res.error.code === '23505' ? 'Another trip already uses that web address. Change the slug.' : 'Could not save: ' + res.error.message)
  refresh()
  back(`/admin/trips/${res.data!.id}`, 'ok', note)
}

export async function duplicateTrip(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id'))
  const sb = adminClient()
  const { data: t, error } = await sb.from('trips').select('*').eq('id', id).single()
  if (error || !t) back(`/admin/trips/${id}`, 'err', 'Could not read the trip to copy.')
  const { id: _i, created_at: _c, ...rest } = t as Record<string, unknown>
  let slug = `${t.slug}-copy`
  for (let i = 2; i < 20; i++) { const { count } = await sb.from('trips').select('id', { count: 'exact', head: true }).eq('slug', slug); if (!count) break; slug = `${t.slug}-copy-${i}` }
  const { data: n, error: e2 } = await sb.from('trips').insert({ ...rest, slug, title: `${t.title} (copy)`, published: false }).select('id').single()
  if (e2) back(`/admin/trips/${id}`, 'err', 'Could not copy: ' + e2.message)
  refresh(); back(`/admin/trips/${n!.id}`, 'ok', 'Copy created and hidden from the website. Rename it, add dates, then tick "Show on website".')
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

/* ───────────── departures (date + price + seats + starting city) ───────────── */
export async function saveDeparture(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') || '')
  const tripId = String(fd.get('trip_id') || '')
  const path = backTo(fd, `/admin/trips/${tripId}`)
  const date = String(fd.get('depart_date') || '')
  const price = int(fd.get('price'), -1)
  const seats = int(fd.get('seats_total'), -1)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) back(path, 'err', 'Pick a departure date.')
  if (price < 0) back(path, 'err', 'Enter the price per person.')
  if (seats < 1 || seats > 500) back(path, 'err', 'Enter the total number of seats (1 to 500).')
  const status = fd.get('status') === 'closed' ? 'closed' : 'open'
  const startCity = text(fd.get('start_city'), 60).replace(/\s+/g, ' ') || 'Ranchi'
  const sb = adminClient()
  // the cab for this date (migration 008); only written when the form has the cab fields
  if (id && fd.has('cab_vehicle')) {
    const phone = String(fd.get('cab_phone') || '').replace(/\D/g, '').slice(-10)
    const cabImg = cleanImage(fd.get('cab_image'))
    const cab = Object.fromEntries(Object.entries({
      vehicle: text(fd.get('cab_vehicle'), 80), number: text(fd.get('cab_number'), 20).toUpperCase(), driver: text(fd.get('cab_driver'), 60),
      driver_phone: phone, pickup: text(fd.get('cab_pickup'), 160), note: text(fd.get('cab_note'), 300), image: cabImg ?? '',
    }).filter(([, v]) => v))
    const { error: ce } = await sb.from('departures').update({ cab }).eq('id', id)
    if (ce && /cab/.test(ce.message) && /column/i.test(ce.message)) back(path, 'err', 'The cab details need the latest database update (008_accounts_reviews_blog.sql). Nothing was saved.')
  }
  const noCityCol = (m: string) => /start_city/.test(m) && /column/i.test(m)
  if (id) {
    const { data: taken } = await sb.rpc('seats_taken', { p_departure: id })
    if (seats < Number(taken ?? 0)) back(path, 'err', `${taken} seats are already booked or held, so the total cannot go below ${taken}.`)
    let { error } = await sb.from('departures').update({ depart_date: date, price, seats_total: seats, status, start_city: startCity }).eq('id', id)
    if (error && noCityCol(error.message)) ({ error } = await sb.from('departures').update({ depart_date: date, price, seats_total: seats, status }).eq('id', id))
    if (error) back(path, 'err', 'Could not save: ' + error.message)
  } else {
    if (!tripId) back(path, 'err', 'Choose the trip for this departure.')
    let { error } = await sb.from('departures').insert({ trip_id: tripId, depart_date: date, price, seats_total: seats, status, start_city: startCity })
    if (error && noCityCol(error.message)) ({ error } = await sb.from('departures').insert({ trip_id: tripId, depart_date: date, price, seats_total: seats, status }))
    if (error) back(path, 'err', 'Could not add: ' + error.message)
  }
  refresh(); back(path, 'ok', id ? 'Departure updated. Existing bookings keep the price they agreed.' : 'Departure added. It is now bookable on the website.')
}

export async function deleteDeparture(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id'))
  const path = backTo(fd, `/admin/trips/${String(fd.get('trip_id'))}`)
  const sb = adminClient()
  const { count } = await sb.from('bookings').select('id', { count: 'exact', head: true }).eq('departure_id', id)
  if (count) back(path, 'err', 'This departure has bookings, so it cannot be deleted. Set it to Closed instead.')
  const { error } = await sb.from('departures').delete().eq('id', id)
  if (error) back(path, 'err', 'Could not delete: ' + error.message)
  refresh(); back(path.startsWith('/admin/departures/') ? '/admin/departures' : path, 'ok', 'Departure deleted.')
}

/* ───────────── destinations / planner rate card ───────────── */
export async function saveDestination(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') || '')
  const name = text(fd.get('name'), 60)
  const path = id ? `/admin/destinations/${id}` : '/admin/destinations/new'
  if (name.length < 2) back(path, 'err', 'Enter a destination name.')
  const used = new Set<string>()
  const activities = json<{ n: string; p: number | string; where: string }[]>(fd.get('activities_json'), [])
    .filter((a) => a.n?.trim())
    .map((a) => { let aid = slugify(a.n).slice(0, 30) || 'act'; while (used.has(aid)) aid += '2'; used.add(aid); return { id: aid, n: a.n.trim(), p: Math.max(0, int(String(a.p))), where: (a.where || name).trim() } })
  const row = {
    name,
    slug: slugify(String(fd.get('slug') || '') || name),
    area: text(fd.get('area'), 80),
    blurb: text(fd.get('blurb'), 400),
    hero_image: cleanImage(fd.get('hero_image')),
    gallery: cleanGallery(fd.get('gallery_json')),
    default_nights: Math.min(30, Math.max(1, int(fd.get('default_nights'), 3))),
    places: String(fd.get('places') || '').split(',').map((s) => s.trim()).filter(Boolean),
    rate_budget: Math.max(0, int(fd.get('rate_budget'))), rate_comfort: Math.max(0, int(fd.get('rate_comfort'))), rate_premium: Math.max(0, int(fd.get('rate_premium'))),
    travel_train: Math.max(0, int(fd.get('travel_train'))), travel_cab: Math.max(0, int(fd.get('travel_cab'))), travel_flight: Math.max(0, int(fd.get('travel_flight'))),
    activities,
    sort_order: int(fd.get('sort_order'), 0),
    published: fd.get('published') === 'on',
  }
  const tiers = ['budget', 'comfort', 'premium']
  const hotels = json<Record<string, string>[]>(fd.get('hotels_json'), [])
    .filter((h) => h.name?.trim())
    .map((h) => { const img = cleanImage(h.image); return { name: h.name.trim().slice(0, 80), place: (h.place || name).trim().slice(0, 60), tier: tiers.includes(h.tier) ? h.tier : 'comfort', stars: Math.min(5, Math.max(0, int(h.stars))), note: (h.note || '').trim().slice(0, 160), ...(img ? { image: img } : {}) } })
  const cars = json<Record<string, string>[]>(fd.get('cars_json'), [])
    .filter((c) => c.name?.trim())
    .map((c) => { const img = cleanImage(c.image); return { name: c.name.trim().slice(0, 80), kind: (c.kind || '').trim().slice(0, 40), seats: Math.min(60, Math.max(1, int(c.seats, 4))), note: (c.note || '').trim().slice(0, 160), ...(img ? { image: img } : {}) } })
  const sb = adminClient()
  const save = (r: object) => (id ? sb.from('destinations').update(r).eq('id', id).select('id').single() : sb.from('destinations').insert(r).select('id').single())
  let res = await save({ ...row, hotels, cars })
  let note = 'Destination saved. The website and planner update within a minute.'
  if (res.error && /hotels|cars/.test(res.error.message) && /column/i.test(res.error.message)) {
    res = await save(row) // database not updated yet (migration 005)
    note = 'Saved, but hotels and cars need a database update first (run supabase/migrations/005_all_india.sql).'
  }
  if (res.error) back(path, 'err', res.error.code === '23505' ? 'Another destination uses that slug.' : 'Could not save: ' + res.error.message)
  refresh(); back(`/admin/destinations/${res.data!.id}`, 'ok', note)
}

export async function deleteDestination(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id'))
  const sb = adminClient()
  const { count } = await sb.from('trips').select('id', { count: 'exact', head: true }).eq('destination_id', id)
  if (count) back(`/admin/destinations/${id}`, 'err', `${count} trip${count === 1 ? ' uses' : 's use'} this destination. Move ${count === 1 ? 'it' : 'them'} to another destination first, or untick "Show on website" to hide it.`)
  const { error } = await sb.from('destinations').delete().eq('id', id)
  if (error) back(`/admin/destinations/${id}`, 'err', 'Could not delete: ' + error.message)
  refresh(); back('/admin/destinations', 'ok', 'Destination deleted.')
}

/* ───────────── site content ───────────── */
export async function saveSite(fd: FormData) {
  await requireAdmin()
  const to = '/admin/site'
  const faqs = json<{ q: string; a: string }[]>(fd.get('faqs_json'), []).filter((f) => f.q?.trim() && f.a?.trim()).map((f) => ({ q: f.q.trim().slice(0, 200), a: f.a.trim().slice(0, 1200) }))
  const home = {
    topbar: text(fd.get('topbar'), 160),
    kicker: text(fd.get('kicker'), 80),
    headline: text(fd.get('headline'), 120),
    intro: text(fd.get('intro'), 300),
    subline: text(fd.get('subline'), 240),
    photosTitle: text(fd.get('photosTitle'), 80),
    photosText: text(fd.get('photosText'), 200),
    faqs,
    photos: cleanGallery(fd.get('photos_json')),
  }
  const email = text(fd.get('email'), 120)
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back(to, 'err', 'That email address does not look right.')
  const gstin = text(fd.get('gstin'), 15).toUpperCase()
  if (gstin && !/^[0-9]{2}[A-Z0-9]{13}$/.test(gstin)) back(to, 'err', 'A GSTIN has 15 characters, starting with 2 digits (for example 20ABCDE1234F1Z5).')
  const ig = text(fd.get('instagram'), 200)
  if (ig && !/^https:\/\/(www\.)?instagram\.com\//.test(ig)) back(to, 'err', 'Paste the full Instagram link, starting with https://www.instagram.com/')
  const business = { email, gstin, address: text(fd.get('address'), 240), instagram: ig }
  const about = {
    title: text(fd.get('about_title'), 120),
    intro: text(fd.get('about_intro'), 400),
    story: String(fd.get('about_story') || '').trim().replace(/\r\n/g, '\n').slice(0, 6000),
    founderName: text(fd.get('founder_name'), 80),
    founderRole: text(fd.get('founder_role'), 120),
    founderPhoto: cleanImage(fd.get('founder_photo')) ?? '',
    founderBio: String(fd.get('founder_bio') || '').trim().replace(/\r\n/g, '\n').slice(0, 2000),
    values: json<{ title: string; text: string }[]>(fd.get('values_json'), []).filter((v) => v.title?.trim()).map((v) => ({ title: v.title.trim().slice(0, 60), text: (v.text || '').trim().slice(0, 240) })).slice(0, 8),
    photos: cleanGallery(fd.get('about_photos_json')).slice(0, 8),
  }
  const now = new Date().toISOString()
  const { error } = await adminClient().from('site_settings').upsert([{ key: 'home', value: home, updated_at: now }, { key: 'business', value: business, updated_at: now }, { key: 'about', value: about, updated_at: now }])
  if (error) back(to, 'err', /site_settings/.test(error.message) ? NEEDS_006 : 'Could not save: ' + error.message)
  refresh(); back(to, 'ok', 'Site content saved. The website updates within a minute.')
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


/* ───────────── PDFs and videos: the browser uploads straight to Storage with a signed link ───────────── */
const FILE_TYPES: Record<string, { ext: string; max: number }> = {
  'application/pdf': { ext: 'pdf', max: 25 * 1024 * 1024 },
  'video/mp4': { ext: 'mp4', max: 200 * 1024 * 1024 },
  'video/quicktime': { ext: 'mov', max: 200 * 1024 * 1024 },
  'video/webm': { ext: 'webm', max: 200 * 1024 * 1024 },
}
export async function signUpload(type: string, size: number): Promise<{ upload?: string; url?: string; error?: string }> {
  if (!(await getAdmin())) return { error: 'Please sign in again.' }
  const t = FILE_TYPES[type]
  if (!t) return { error: 'Use a PDF, or an MP4 / MOV / WebM video.' }
  if (!(size > 0) || size > t.max) return { error: `That file is too large (max ${Math.round(t.max / 1048576)} MB).` }
  const path = `${t.ext === 'pdf' ? 'itineraries' : 'videos'}/${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${t.ext}`
  const sb = adminClient()
  const { data, error } = await sb.storage.from('media').createSignedUploadUrl(path)
  if (error || !data) return { error: 'Could not start the upload: ' + (error?.message ?? 'unknown error') }
  return { upload: data.signedUrl, url: sb.storage.from('media').getPublicUrl(path).data.publicUrl }
}

/* ───────────── a personal itinerary for one booking ───────────── */
export async function setBookingItinerary(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('booking_id') || '')
  const to = backTo(fd, '/admin/bookings')
  const url = cleanImage(fd.get('itinerary_url'))
  const { error } = await adminClient().from('bookings').update({ itinerary_url: url }).eq('id', id)
  if (error) back(to, 'err', /itinerary_url/.test(error.message) ? NEEDS_008 : 'Could not save: ' + error.message)
  back(to, 'ok', url ? 'Itinerary saved. The traveller can download it from their booking and My trips.' : 'Personal itinerary removed. The trip itinerary is shown instead.')
}

/* ───────────── reviews ───────────── */
export async function moderateReview(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') || '')
  const to = backTo(fd, '/admin/reviews')
  const status = String(fd.get('status') || '')
  const patch: Record<string, unknown> = {}
  if (['pending', 'approved', 'hidden'].includes(status)) patch.status = status
  if (fd.has('reply')) patch.reply = text(fd.get('reply'), 1000)
  const { error } = await adminClient().from('reviews').update(patch).eq('id', id)
  if (error) back(to, 'err', /reviews/.test(error.message) ? NEEDS_008 : 'Could not save: ' + error.message)
  refresh()
  back(to, 'ok', status === 'approved' ? 'Review approved. It is now on the website.' : status === 'hidden' ? 'Review hidden from the website.' : 'Review saved.')
}
export async function deleteReview(fd: FormData) {
  await requireAdmin()
  const { error } = await adminClient().from('reviews').delete().eq('id', String(fd.get('id') || ''))
  if (error) back('/admin/reviews', 'err', 'Could not delete: ' + error.message)
  refresh(); back('/admin/reviews', 'ok', 'Review deleted.')
}

/* ───────────── enquiries ───────────── */
export async function updateEnquiry(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') || '')
  const to = backTo(fd, '/admin/enquiries')
  const status = String(fd.get('status') || '')
  const patch: Record<string, unknown> = {}
  if (['new', 'replied', 'closed'].includes(status)) patch.status = status
  if (fd.has('admin_note')) patch.admin_note = text(fd.get('admin_note'), 1000)
  const { error } = await adminClient().from('enquiries').update(patch).eq('id', id)
  if (error) back(to, 'err', /enquiries/.test(error.message) ? NEEDS_008 : 'Could not save: ' + error.message)
  back(to, 'ok', 'Enquiry updated.')
}

/* ───────────── blog ───────────── */
export async function savePost(fd: FormData) {
  await requireAdmin()
  const id = String(fd.get('id') || '')
  const path = id ? `/admin/blog/${id}` : '/admin/blog/new'
  const title = text(fd.get('title'), 140)
  if (title.length < 3) back(path, 'err', 'Give the story a title.')
  const media = json<{ type: string; src: string; poster?: string; caption?: string }[]>(fd.get('media_json'), [])
    .map((m) => {
      const src = cleanImage(m.src)
      const poster = cleanImage(m.poster)
      return src ? { type: m.type === 'video' || /\.(mp4|mov|webm)$/i.test(src) ? 'video' : 'photo', src, ...(poster ? { poster } : {}), caption: text(m.caption ?? '', 300) } : null
    })
    .filter(Boolean)
    .slice(0, 60)
  const published = fd.get('published') === 'on'
  const date = String(fd.get('published_at') || '')
  const row = {
    title,
    slug: slugify(String(fd.get('slug') || '') || title),
    excerpt: text(fd.get('excerpt'), 400),
    cover: cleanImage(fd.get('cover')),
    body: String(fd.get('body') || '').trim().replace(/\r\n/g, '\n').slice(0, 30000),
    media,
    place: text(fd.get('place'), 80),
    trip_id: String(fd.get('trip_id') || '') || null,
    published,
    published_at: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : published ? new Date().toISOString().slice(0, 10) : null,
    updated_at: new Date().toISOString(),
  }
  if (!row.slug) back(path, 'err', 'The web address (slug) cannot be empty.')
  const sb = adminClient()
  const res = id ? await sb.from('posts').update(row).eq('id', id).select('id').single() : await sb.from('posts').insert(row).select('id').single()
  if (res.error) back(path, 'err', res.error.code === '23505' ? 'Another story already uses that web address.' : /posts/.test(res.error.message) ? NEEDS_008 : 'Could not save: ' + res.error.message)
  refresh()
  back(`/admin/blog/${res.data!.id}`, 'ok', published ? 'Story saved and live on the website.' : 'Draft saved. Tick "Publish" when it is ready.')
}
export async function deletePost(fd: FormData) {
  await requireAdmin()
  const { error } = await adminClient().from('posts').delete().eq('id', String(fd.get('id') || ''))
  if (error) back('/admin/blog', 'err', 'Could not delete: ' + error.message)
  refresh(); back('/admin/blog', 'ok', 'Story deleted.')
}
