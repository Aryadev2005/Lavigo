'use server'

import { revalidatePath } from 'next/cache'
import { getCustomer, saveProfile } from '@/lib/customer'
import { adminClient, writesConfigured } from '@/lib/supabase'

export type EngageState = { error?: string; ok?: boolean; wa?: string }

const NEEDS_008 = 'This needs the latest database update. Please message us on WhatsApp for now.'
const missingTable = (e: { code?: string; message?: string } | null) =>
  Boolean(e && (e.code === '42P01' || e.code === 'PGRST205' || /relation .* does not exist|could not find the table/i.test(e.message || '')))

function cleanPhone(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d
}
const line = (v: FormDataEntryValue | null, max: number) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, max)
const text = (v: FormDataEntryValue | null, max: number) => String(v || '').trim().replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').slice(0, max)

/** Customer review of Lavigo (signed-in only). Goes to the owner for approval before it is shown. */
export async function submitReview(_p: EngageState, fd: FormData): Promise<EngageState> {
  if (String(fd.get('website') || '').trim()) return { error: 'Something went wrong. Please try again.' }
  const me = await getCustomer()
  if (!me) return { error: 'Please sign in to write a review.' }
  if (!writesConfigured) return { error: NEEDS_008 }
  const rating = Number(fd.get('rating'))
  const name = line(fd.get('name'), 60) || me.name
  const city = line(fd.get('city'), 60)
  const title = line(fd.get('title'), 100)
  const body = text(fd.get('body'), 2000)
  if (!(rating >= 1 && rating <= 5)) return { error: 'Please choose a star rating.' }
  if (name.length < 2) return { error: 'Please add your name.' }
  if (body.length < 20) return { error: 'Please write a little more about your trip (at least 20 characters).' }

  const sb = adminClient()
  // link to the customer's own booking when they review a specific trip
  let booking_id: string | null = null
  let trip_id: string | null = null
  const code = line(fd.get('booking'), 12).toUpperCase()
  if (/^LVG-[0-9A-Z]{5}$/.test(code)) {
    const { data } = await sb.from('bookings').select('id,user_id,departure:departures(trip_id)').eq('code', code).maybeSingle()
    const b = data as unknown as { id: string; user_id: string | null; departure: { trip_id: string } } | null
    if (b && b.user_id === me.id) { booking_id = b.id; trip_id = b.departure.trip_id }
  }
  const recent = await sb.from('reviews').select('id', { count: 'exact' }).eq('user_id', me.id).gte('created_at', new Date(Date.now() - 86400000).toISOString()).limit(1)
  if (missingTable(recent.error)) return { error: NEEDS_008 }
  if ((recent.count ?? 0) >= 3) return { error: 'Thank you! You have already sent a few reviews today.' }

  const { error } = await sb.from('reviews').insert({ user_id: me.id, booking_id, trip_id, name, city, rating, title, body })
  if (error) return { error: missingTable(error) ? NEEDS_008 : 'Could not send your review. Please try again.' }
  if (!me.name) await saveProfile({ id: me.id, email: me.email, name })
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

/** Enquiry to the owner: saved for the admin inbox, then the visitor is sent to WhatsApp with the details. */
export async function sendEnquiry(_p: EngageState, fd: FormData): Promise<EngageState> {
  if (String(fd.get('website') || '').trim()) return { error: 'Something went wrong. Please try again.' }
  const kindRaw = String(fd.get('kind') || 'question')
  const kind = (['custom', 'question', 'trip'] as const).includes(kindRaw as 'custom') ? (kindRaw as 'custom' | 'question' | 'trip') : 'question'
  const name = line(fd.get('name'), 80)
  const phone = cleanPhone(String(fd.get('phone') || ''))
  const email = line(fd.get('email'), 120)
  const message = text(fd.get('message'), 2000)
  const details: Record<string, string> = {}
  for (const k of ['destination', 'start_city', 'dates', 'travellers', 'budget', 'trip', 'nights']) {
    const v = line(fd.get(k), 120)
    if (v) details[k] = v
  }
  if (name.length < 2) return { error: 'Please enter your name.' }
  if (!/^[6-9]\d{9}$/.test(phone)) return { error: 'Please enter a valid 10-digit WhatsApp number.' }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'That email address does not look right.' }
  if (kind === 'custom' && !details.destination) return { error: 'Where would you like to go?' }
  if (kind !== 'custom' && message.length < 5) return { error: 'Please type your question.' }

  const me = await getCustomer().catch(() => null)
  const parts = [
    kind === 'custom' ? 'Hi Lavigo, I would like a custom trip.' : kind === 'trip' ? `Hi Lavigo, a question about ${details.trip || 'a trip'}.` : 'Hi Lavigo, I have a question.',
    details.destination && `Destination: ${details.destination}`,
    details.start_city && `Starting from: ${details.start_city}`,
    details.dates && `Dates: ${details.dates}`,
    details.nights && `Nights: ${details.nights}`,
    details.travellers && `Travellers: ${details.travellers}`,
    details.budget && `Budget: ${details.budget}`,
    message && `\n${message}`,
    `\n— ${name}, ${phone}`,
  ].filter(Boolean)
  const wa = parts.join('\n')

  if (writesConfigured) {
    let trip_id: string | null = null
    const slug = line(fd.get('trip_slug'), 80)
    if (slug) {
      const t = await adminClient().from('trips').select('id').eq('slug', slug).maybeSingle()
      trip_id = (t.data?.id as string) ?? null
    }
    const sb = adminClient()
    const recent = await sb.from('enquiries').select('id', { count: 'exact' }).eq('phone', phone).gte('created_at', new Date(Date.now() - 3600000).toISOString()).limit(1)
    if (!recent.error && (recent.count ?? 0) >= 5) return { ok: true, wa } // don't store floods, but still let them reach WhatsApp
    const { error } = await sb.from('enquiries').insert({ kind, user_id: me?.id ?? null, trip_id, name, phone, email: email || me?.email || null, message, details })
    if (error && !missingTable(error)) console.error('enquiry insert failed', error.message)
    revalidatePath('/admin', 'layout')
  }
  return { ok: true, wa }
}
