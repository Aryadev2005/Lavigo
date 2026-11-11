import { NextResponse, type NextRequest } from 'next/server'
import { authClient } from '@/lib/admin-auth'
import { saveProfile } from '@/lib/customer'

export const dynamic = 'force-dynamic'

// Google sign-in, email confirmation and password-reset links all land here with a one-time code.
export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const raw = url.searchParams.get('next') || '/account'
  const next = raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/admin') ? raw : '/account'
  const back = (path: string) => NextResponse.redirect(new URL(path, url.origin))
  if (!code) return back('/login?e=link')
  const sb = await authClient()
  const { data, error } = await sb.auth.exchangeCodeForSession(code)
  if (error || !data.user) return back(`/login?e=link&next=${encodeURIComponent(next)}`)
  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>
  const name = String(meta.full_name || meta.name || '')
  await saveProfile({ id: data.user.id, email: data.user.email ?? '', ...(name ? { name } : {}) }, true)
  return back(next)
}
