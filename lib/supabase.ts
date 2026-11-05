import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

/** True when the site is connected to Supabase. When false the site runs in read-only demo mode on seed data. */
export const dbConfigured = Boolean(url && anon)
export const writesConfigured = Boolean(url && service)

/** Public read-only client (RLS applies). Safe for static/ISR pages: it never touches cookies. */
export function publicClient(): SupabaseClient {
  if (!url || !anon) throw new Error('Supabase is not configured')
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Service-role client. SERVER ONLY: bypasses RLS. Never import into a client component. */
export function adminClient(): SupabaseClient {
  if (!url || !service) throw new Error('Supabase service role is not configured')
  return createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
}
