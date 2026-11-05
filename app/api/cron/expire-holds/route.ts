import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { adminClient, writesConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Housekeeping: marks lapsed holds as "expired" and refreshes pages.
// (Seats are already free the moment a hold lapses; this only tidies the records.)
// Vercel Cron calls this with "Authorization: Bearer $CRON_SECRET".
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new NextResponse('Unauthorized', { status: 401 })
  if (!writesConfigured) return NextResponse.json({ ok: false, reason: 'not configured' })
  const { data, error } = await adminClient().rpc('expire_holds')
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true, expired: data })
}
