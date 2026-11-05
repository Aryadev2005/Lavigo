'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { adminClient, writesConfigured } from '@/lib/supabase'
import { HOLD_HOURS } from '@/lib/config'

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
  departure_not_found: 'That departure is no longer available.',
}

export async function reserveSeats(_prev: ReserveState, fd: FormData): Promise<ReserveState> {
  // honeypot: real people never fill this hidden field
  if (String(fd.get('website') || '').trim()) return { error: 'Something went wrong. Please try again.' }
  if (!writesConfigured) return { error: 'Online booking is not switched on yet. Please message us on WhatsApp to book.' }

  const departureId = String(fd.get('departure_id') || '')
  const name = String(fd.get('name') || '').trim()
  const phone = cleanPhone(String(fd.get('phone') || ''))
  const email = String(fd.get('email') || '').trim()
  const others = String(fd.get('others') || '').trim().slice(0, 300)
  const travellers = Number(fd.get('travellers') || 0)

  if (!departureId) return { error: 'Please choose a departure date.' }
  if (name.length < 2) return { error: MESSAGES.bad_name }
  if (!/^[6-9]\d{9}$/.test(phone)) return { error: MESSAGES.bad_phone }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'That email address does not look right.' }
  if (!Number.isInteger(travellers) || travellers < 1 || travellers > 20) return { error: MESSAGES.bad_travellers }

  const { data, error } = await adminClient().rpc('create_hold', {
    p_departure: departureId,
    p_name: name.slice(0, 80),
    p_phone: phone,
    p_email: email || null,
    p_travellers: travellers,
    p_others: others || null,
    p_hold_minutes: HOLD_HOURS * 60,
  })

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
  revalidatePath('/', 'layout') // refresh seat counts everywhere
  redirect(`/booking/${code}`)
}
