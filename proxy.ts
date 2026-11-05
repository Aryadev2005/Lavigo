import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Runs only on /admin/*: keeps the Supabase session fresh and bounces signed-out visitors to the login page.
// This is an optimistic check. Every admin page and action ALSO calls requireAdmin().
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
  if (!data.user && path !== '/admin/login') {
    const to = request.nextUrl.clone()
    to.pathname = '/admin/login'
    to.search = ''
    return NextResponse.redirect(to)
  }
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

export const config = { matcher: ['/admin/:path*'] }
