import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON, SUPABASE_URL } from './lib/env'

// Keeps the Supabase session fresh on /admin/* and the customer pages (My trips, reviews, sign-in links).
// On /admin it also bounces signed-out visitors to the admin login. This is an optimistic check:
// every admin page and action ALSO calls requireAdmin(), and customer pages call requireCustomer().
export async function proxy(request: NextRequest) {
  const url = SUPABASE_URL
  const anon = SUPABASE_ANON
  if (!url || !anon) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  if (!path.startsWith('/admin')) return response
  if (!data.user && path !== '/admin/login') {
    const to = request.nextUrl.clone()
    to.pathname = '/admin/login'
    to.search = ''
    return NextResponse.redirect(to)
  }
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

export const config = { matcher: ['/admin/:path*', '/account/:path*', '/reviews/new', '/api/me'] }
