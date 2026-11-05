import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const authConfigured = Boolean(url && anon)

/** Supabase client bound to the visitor's session cookies. Used only for login and "who am I". */
export async function authClient() {
  if (!url || !anon) throw new Error('Supabase is not configured')
  const jar = await cookies()
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => jar.set(name, value, options)) } catch { /* called from a Server Component: proxy refreshes sessions */ }
      },
    },
  })
}

/** Emails allowed into /admin. Comma-separated env var. Unset = nobody gets in. */
function allowlist() {
  return (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
}

export async function getAdmin() {
  if (!authConfigured) return null
  const sb = await authClient()
  const { data } = await sb.auth.getUser() // verifies the JWT with Supabase (not just the cookie)
  const email = data.user?.email?.toLowerCase()
  if (!data.user || !email || !allowlist().includes(email)) return null
  return data.user
}

/** Call at the top of EVERY admin page and EVERY admin server action. */
export async function requireAdmin() {
  const user = await getAdmin()
  if (!user) redirect('/admin/login')
  return user
}
