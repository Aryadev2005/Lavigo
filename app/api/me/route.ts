import { NextResponse } from 'next/server'
import { getCustomer } from '@/lib/customer'

export const dynamic = 'force-dynamic'

// Who is signed in, for the header and booking form on static pages. Also refreshes the session cookie.
export async function GET() {
  const user = await getCustomer().catch(() => null)
  return NextResponse.json({ user }, { headers: { 'cache-control': 'no-store' } })
}
