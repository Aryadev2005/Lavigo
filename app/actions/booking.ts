'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { adminClient, writesConfigured } from '@/lib/supabase'
import { CHILD_FACTOR, CHILD_MAX_AGE, HOLD_HOURS } from '@/lib/config'
import { getCustomer, saveProfile } from '@/lib/customer'
import type { Gender, Passenger, TicketBy } from '@/lib/types'

export type ReserveState = { error?: string }

function cleanPhone(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d
}

const MESSAGES: Record<string, string> = {
  departure_closed: 'Bookings for this departure are closed. Please message us on WhatsApp.',
  departure_past: 'This departure has already left. Please pick another date.',
  too_many_holds: 'You already have two bookings waiting for payment. Please complete or cancel those first, or message us on WhatsApp.',
  rate_limited: 'Too many attempts from this number. Please try again later or message us on WhatsApp.',
  bad_phone: 'Please enter a valid 10-digit mobile number.',
  bad_name: 'Please enter your full name.',
  bad_travellers: 'Travellers must be between 1 and 20.',
  bad_gender: 'Please choose male or female for every traveller.',
  bad_ticket_by: 'Please choose who books the train or flight tickets.',
  departure_not_found: 'That departure is no longer available.',
  bad_dob: 'Please enter a real date of birth for every traveller.',
  adult_required: `At least one traveller must be an adult (over ${CHILD_MAX_AGE}).`,
  sign_in_required: 'Please sign in to book.',
}

export async function reserveSeats(_prev: ReserveState, fd: FormData): Promise<ReserveState> {
  // honeypot: real people never fill this hidden field
  if (String(fd.get('website') || '').trim()) return { error: 'Something went wrong. Please try again.' }
  if (!writesConfigured) return { error: 'Online booking is not switched on yet. Please message us on WhatsApp to book.' }

  const me = await getCustomer()
  if (!me) return { error: 'Please sign in to book. Your session may have expired.' }

  const departureId = String(fd.get('departure_id') || '')
  const phone = cleanPhone(String(fd.get('phone') || ''))
  const email = me.email
  const names = fd.getAll('pax_name').map((v) => String(v).trim().replace(/\s+/g, ' ').slice(0, 80))
  const genders = fd.getAll('pax_gender').map((v) => String(v))
  const dobs = fd.getAll('pax_dob').map((v) => String(v).trim())
  const ticketBy: TicketBy = fd.get('ticket_by') === 'self' ? 'self' : 'agency'
  const fromCity = ticketBy === 'agency' ? String(fd.get('from_city') || '').trim().slice(0, 60) : ''

  if (!departureId) return { error: 'Please choose a departure date.' }
  if (!names.length || names.length > 20 || genders.length !== names.length) return { error: MESSAGES.bad_travellers }
  if (names.some((x) => x.length < 2)) return { error: 'Please enter the full name of every traveller.' }
  if (genders.some((g) => g !== 'male' && g !== 'female')) return { error: MESSAGES.bad_gender }
  const todayIso = new Date().toISOString().slice(0, 10)
  if (dobs.length !== names.length || dobs.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d) || d > todayIso || d < '1910-01-01')) return { error: MESSAGES.bad_dob }
  if (ticketBy === 'agency' && fromCity.length < 2) return { error: 'Tell us which city you are travelling from, so we can book your tickets.' }
  if (!/^[6-9]\d{9}$/.test(phone)) return { error: MESSAGES.bad_phone }

  const passengers: Passenger[] = names.map((name, i) => ({ name, gender: genders[i] as Gender, dob: dobs[i] }))
  const sb = adminClient()
  let { data, error } = await sb.rpc('create_hold_v3', {
    p_departure: departureId,
    p_user: me.id,
    p_phone: phone,
    p_email: email || null,
    p_passengers: passengers,
    p_ticket_by: ticketBy,
    p_from_city: fromCity || null,
    p_hold_minutes: HOLD_HOURS * 60,
    p_child_max_age: CHILD_MAX_AGE,
    p_child_factor: CHILD_FACTOR,
  })
  const missing = (e: typeof error) => Boolean(e && (e.code === 'PGRST202' || /could not find the function/i.test(e.message)))
  // Before migration 008 there is no create_hold_v3 (no accounts or ages in the database yet): use v2.
  if (missing(error)) ({ data, error } = await sb.rpc('create_hold_v2', {
    p_departure: departureId,
    p_phone: phone,
    p_email: email || null,
    p_passengers: passengers,
    p_ticket_by: ticketBy,
    p_from_city: fromCity || null,
    p_hold_minutes: HOLD_HOURS * 60,
  }))

  // Before migration 005 is run there is no create_hold_v2: fall back to the original
  // function and keep the travellers, genders and ticket choice in the notes field.
  if (missing(error)) {
    const label = (p: Passenger) => `${p.name} (${p.gender === 'male' ? 'Male' : 'Female'})`
    const notes = [
      `Travellers: ${passengers.map(label).join(', ')}`,
      ticketBy === 'agency' ? `Tickets: Lavigo to book from ${fromCity}` : 'Tickets: booking own',
    ].join(' · ').slice(0, 1000)
    ;({ data, error } = await sb.rpc('create_hold', {
      p_departure: departureId,
      p_name: passengers[0].name,
      p_phone: phone,
      p_email: email || null,
      p_travellers: passengers.length,
      p_others: notes,
      p_hold_minutes: HOLD_HOURS * 60,
    }))
  }

  if (error) {
    const m = error.message || ''
    const seats = m.match(/not_enough_seats:(\d+)/)
    if (seats) {
      const n = Number(seats[1])
      return { error: n > 0 ? `Only ${n} seat${n > 1 ? 's' : ''} left on this date. Please reduce the number of travellers.` : 'Sorry, this departure just sold out.' }
    }
    const key = Object.keys(MESSAGES).find((k) => m.includes(k))
    if (key) return { error: MESSAGES[key] }
    console.error('create_hold failed', m)
    return { error: 'Could not hold your seats. Please try again or message us on WhatsApp.' }
  }

  const code = (data as { code: string }).code
  if (!me.phone || !me.name) await saveProfile({ id: me.id, email: me.email, ...(me.name ? {} : { name: names[0] }), ...(me.phone ? {} : { phone }) })
  revalidatePath('/', 'layout') // refresh seat counts everywhere
  redirect(`/booking/${code}`)
}
