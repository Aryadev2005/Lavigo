'use server'

import { createHash, randomInt } from 'node:crypto'
import { redirect } from 'next/navigation'
import { getCustomer } from '@/lib/customer'
import { adminClient, writesConfigured } from '@/lib/supabase'

export type OtpState = { error?: string; info?: string; sent?: string } // sent = the 10-digit number a code went to

const TTL_MIN = 5 // must match the "login_code" template's code_expiration_minutes
const RESEND_SEC = 60
const MAX_PER_HOUR = 5

const hash = (userId: string, code: string) => createHash('sha256').update(`${userId}:${code}`).digest('hex')
const safeNext = (v: FormDataEntryValue | null) => {
  const s = String(v || '')
  return s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/admin') ? s : '/account'
}
function cleanPhone(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d
}

/** Send the approved AUTHENTICATION template. Code goes in the body and in the copy-code button. */
async function sendWhatsAppOtp(phone10: string, code: string) {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN
  const from = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !from) throw new Error('WhatsApp is not configured')
  const res = await fetch(`https://graph.facebook.com/v21.0/${from}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: `91${phone10}`,
      type: 'template',
      template: {
        name: 'login_code',
        language: { code: 'en' },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: code }] },
          { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
        ],
      },
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`WhatsApp send failed ${res.status}: ${(await res.text()).slice(0, 300)}`)
}

export async function requestOtp(_p: OtpState, fd: FormData): Promise<OtpState> {
  const me = await getCustomer()
  if (!me) return { error: 'Please sign in again.' }
  if (!writesConfigured) return { error: 'Phone verification is not switched on yet.' }
  const phone = cleanPhone(String(fd.get('phone') || ''))
  if (!/^[6-9]\d{9}$/.test(phone)) return { error: 'Please enter a valid 10-digit Indian mobile number.' }

  const sb = adminClient()
  const taken = await sb.from('profiles').select('id').eq('phone', phone).not('phone_verified_at', 'is', null).neq('id', me.id).limit(1)
  if (taken.data?.length) return { error: 'This number is already linked to another Lavigo account.' }

  const now = Date.now()
  const { data: prev } = await sb.from('phone_otps').select('sent_at,sends,window_start').eq('user_id', me.id).maybeSingle()
  if (prev && now - Date.parse(prev.sent_at) < RESEND_SEC * 1000) return { error: 'Please wait a minute before asking for a new code.', sent: phone }
  const sameWindow = prev && now - Date.parse(prev.window_start) < 3600_000
  if (sameWindow && prev.sends >= MAX_PER_HOUR) return { error: 'Too many codes requested. Please try again in an hour.' }

  const code = String(randomInt(100000, 1000000))
  const { error } = await sb.from('phone_otps').upsert({
    user_id: me.id, phone, code_hash: hash(me.id, code), attempts: 0,
    expires_at: new Date(now + TTL_MIN * 60_000).toISOString(), sent_at: new Date(now).toISOString(),
    sends: sameWindow ? prev.sends + 1 : 1, window_start: sameWindow ? prev.window_start : new Date(now).toISOString(),
  }, { onConflict: 'user_id' })
  if (error) { console.error('phone_otps upsert failed', error.message); return { error: 'Could not send a code. Please try again.' } }

  try { await sendWhatsAppOtp(phone, code) } catch (e) {
    console.error(e)
    return { error: 'We could not send a WhatsApp message to this number. Check that it is on WhatsApp and try again.' }
  }
  return { sent: phone, info: `We sent a 6-digit code on WhatsApp to +91 ${phone}.` }
}

const VERIFY_MSG: Record<string, string> = {
  no_code: 'Please ask for a code first.',
  expired: 'That code has expired. Please ask for a new one.',
  wrong: 'That code is not right. Please check and try again.',
  too_many: 'Too many wrong tries. Please ask for a new code.',
  taken: 'This number is already linked to another Lavigo account.',
}

export async function verifyOtp(p: OtpState, fd: FormData): Promise<OtpState> {
  const me = await getCustomer()
  if (!me) return { error: 'Please sign in again.' }
  const code = String(fd.get('code') || '').replace(/\D/g, '')
  if (code.length !== 6) return { ...p, error: 'Please enter the 6-digit code.', info: undefined }
  const { data, error } = await adminClient().rpc('verify_phone_otp', { p_user: me.id, p_hash: hash(me.id, code) })
  if (error) { console.error('verify_phone_otp failed', error.message); return { ...p, error: 'Something went wrong. Please try again.', info: undefined } }
  if (data !== 'ok') return { ...p, error: VERIFY_MSG[data as string] ?? VERIFY_MSG.wrong, info: undefined }
  redirect(safeNext(fd.get('next')))
}
