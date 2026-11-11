import 'server-only'
import { redirect } from 'next/navigation'
import { authClient, authConfigured } from './admin-auth'
import { adminClient, writesConfigured } from './supabase'

export type Customer = { id: string; email: string; name: string; phone: string }

/** The signed-in customer (any Supabase Auth user), with their saved name and phone. Null when signed out. */
export async function getCustomer(): Promise<Customer | null> {
  if (!authConfigured) return null
  const sb = await authClient()
  const { data } = await sb.auth.getUser() // verified with Supabase, not just read from the cookie
  const u = data.user
  if (!u) return null
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>
  let name = String(meta.full_name || meta.name || '')
  let phone = ''
  if (writesConfigured) {
    try {
      const { data: p, error } = await adminClient().from('profiles').select('full_name,phone').eq('id', u.id).maybeSingle()
      if (!error && p) { name = p.full_name || name; phone = p.phone || '' }
    } catch { /* profiles table not there yet (migration 008) */ }
  }
  return { id: u.id, email: u.email ?? '', name, phone }
}

/** Use at the top of pages that need an account; sends visitors to sign in and back again. */
export async function requireCustomer(next: string): Promise<Customer> {
  const c = await getCustomer()
  if (!c) redirect(`/login?next=${encodeURIComponent(next)}`)
  return c
}

/** Create or update the customer's profile row. Quietly does nothing before migration 008. */
export async function saveProfile(c: { id: string; email: string; name?: string; phone?: string }, keepName = false) {
  if (!writesConfigured) return
  if (keepName && c.name !== undefined) {
    // sign-in from Google / email link: don't overwrite a name the customer has already edited
    try {
      const { data } = await adminClient().from('profiles').select('full_name').eq('id', c.id).maybeSingle()
      if (data?.full_name) c = { ...c, name: undefined }
    } catch { /* ignore */ }
  }
  const row: Record<string, unknown> = { id: c.id, email: c.email, updated_at: new Date().toISOString() }
  if (c.name !== undefined) row.full_name = c.name.slice(0, 80)
  if (c.phone !== undefined) row.phone = c.phone.slice(0, 15)
  try {
    const { error } = await adminClient().from('profiles').upsert(row, { onConflict: 'id' })
    if (error && !/profiles/.test(error.message)) console.error('saveProfile failed', error.message)
  } catch { /* ignore */ }
}
