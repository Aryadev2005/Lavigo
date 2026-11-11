'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { authClient, authConfigured } from '@/lib/admin-auth'
import { SITE_URL } from '@/lib/config'
import { getCustomer, saveProfile } from '@/lib/customer'

export type AuthState = { error?: string; info?: string }

/** Only ever send people back to a page on this site. */
function safeNext(v: FormDataEntryValue | string | null | undefined) {
  const s = String(v || '')
  return s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/admin') ? s : '/account'
}

async function origin() {
  const h = await headers()
  const o = h.get('origin')
  if (o && /^https?:\/\//.test(o)) return o
  const host = h.get('x-forwarded-host') || h.get('host')
  if (host) return `${h.get('x-forwarded-proto') || 'https'}://${host}`
  return SITE_URL
}

const MSG: Record<string, string> = {
  invalid_credentials: 'That email and password do not match. Try again, or reset your password.',
  email_not_confirmed: 'Please confirm your email first: open the link we sent you.',
  user_already_exists: 'There is already an account with this email. Please sign in instead.',
  weak_password: 'Please choose a password with at least 8 characters.',
  over_email_send_rate_limit: 'Too many emails sent. Please wait a minute and try again.',
}
function friendly(e: { code?: string; message?: string } | null) {
  if (!e) return 'Something went wrong. Please try again.'
  if (e.code && MSG[e.code]) return MSG[e.code]
  if (/invalid login/i.test(e.message || '')) return MSG.invalid_credentials
  if (/already registered/i.test(e.message || '')) return MSG.user_already_exists
  if (/not confirmed/i.test(e.message || '')) return MSG.email_not_confirmed
  return e.message || 'Something went wrong. Please try again.'
}

export async function signInCustomer(_p: AuthState, fd: FormData): Promise<AuthState> {
  if (!authConfigured) return { error: 'Accounts are not switched on yet.' }
  const email = String(fd.get('email') || '').trim().toLowerCase()
  const password = String(fd.get('password') || '')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Please enter a valid email address.' }
  if (!password) return { error: 'Please enter your password.' }
  const sb = await authClient()
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { error: friendly(error) }
  await saveProfile({ id: data.user.id, email })
  redirect(safeNext(fd.get('next')))
}

export async function signUpCustomer(_p: AuthState, fd: FormData): Promise<AuthState> {
  if (!authConfigured) return { error: 'Accounts are not switched on yet.' }
  const name = String(fd.get('name') || '').trim().replace(/\s+/g, ' ').slice(0, 80)
  const email = String(fd.get('email') || '').trim().toLowerCase()
  const password = String(fd.get('password') || '')
  const next = safeNext(fd.get('next'))
  if (name.length < 2) return { error: 'Please enter your full name.' }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Please enter a valid email address.' }
  if (password.length < 8) return { error: MSG.weak_password }
  const sb = await authClient()
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { full_name: name }, emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  })
  if (error) return { error: friendly(error) }
  // Supabase hides "already registered" behind an empty identities list when email confirmation is on
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0 && !data.session) return { error: MSG.user_already_exists }
  if (data.user) await saveProfile({ id: data.user.id, email, name })
  if (!data.session) return { info: `We have sent a confirmation link to ${email}. Open it to finish creating your account, then you can book.` }
  redirect(next)
}

export async function googleSignIn(fd: FormData) {
  if (!authConfigured) redirect('/login?e=off')
  const next = safeNext(fd.get('next'))
  const sb = await authClient()
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`, queryParams: { prompt: 'select_account' } },
  })
  if (error || !data.url) redirect(`/login?e=google&next=${encodeURIComponent(next)}`)
  redirect(data.url)
}

export async function sendPasswordReset(_p: AuthState, fd: FormData): Promise<AuthState> {
  if (!authConfigured) return { error: 'Accounts are not switched on yet.' }
  const email = String(fd.get('email') || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Please enter the email you signed up with.' }
  const sb = await authClient()
  await sb.auth.resetPasswordForEmail(email, { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent('/account?reset=1')}` })
  // Same answer whether or not the account exists, so nobody can test which emails are registered.
  return { info: `If ${email} has a Lavigo account, a link to set a new password is on its way.` }
}

export async function setNewPassword(_p: AuthState, fd: FormData): Promise<AuthState> {
  const c = await getCustomer()
  if (!c) return { error: 'Please sign in again.' }
  const password = String(fd.get('password') || '')
  if (password.length < 8) return { error: MSG.weak_password }
  const sb = await authClient()
  const { error } = await sb.auth.updateUser({ password })
  if (error) return { error: friendly(error) }
  return { info: 'Your new password is saved.' }
}

export async function saveMyProfile(_p: AuthState, fd: FormData): Promise<AuthState> {
  const c = await getCustomer()
  if (!c) return { error: 'Please sign in again.' }
  const name = String(fd.get('name') || '').trim().replace(/\s+/g, ' ').slice(0, 80)
  let phone = String(fd.get('phone') || '').replace(/\D/g, '')
  if (phone.length === 12 && phone.startsWith('91')) phone = phone.slice(2)
  if (name.length < 2) return { error: 'Please enter your full name.' }
  if (phone && !/^[6-9]\d{9}$/.test(phone)) return { error: 'Please enter a valid 10-digit mobile number.' }
  await saveProfile({ id: c.id, email: c.email, name, phone })
  return { info: 'Saved.' }
}

export async function signOutCustomer() {
  if (authConfigured) {
    const sb = await authClient()
    await sb.auth.signOut()
  }
  redirect('/')
}
