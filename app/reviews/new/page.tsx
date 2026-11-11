import type { Metadata } from 'next'
import { ReviewForm } from '@/components/ReviewForm'
import { requireCustomer } from '@/lib/customer'
import { adminClient, writesConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Write a review', robots: { index: false, follow: false } }

export default async function NewReview({ searchParams }: { searchParams: Promise<{ booking?: string }> }) {
  const sp = await searchParams
  const code = (sp.booking || '').toUpperCase()
  const me = await requireCustomer(`/reviews/new${code ? `?booking=${code}` : ''}`)
  let tripTitle = ''
  if (writesConfigured && /^LVG-[0-9A-Z]{5}$/.test(code)) {
    const { data } = await adminClient().from('bookings').select('user_id,departure:departures(trip:trips(title))').eq('code', code).maybeSingle()
    const b = data as unknown as { user_id: string | null; departure: { trip: { title: string } } } | null
    if (b?.user_id === me.id) tripTitle = b.departure.trip.title
  }
  return (
    <div className="pg">
      <header className="pg-hero pg-hero-sm">
        <div className="m-wrap">
          <p className="lv-eyebrow">Review Lavigo</p>
          <h1 className="pg-h">How was <em>{tripTitle || 'your trip'}?</em></h1>
          <p className="pg-sub">Tell the next group what it was really like: the hotels, the food, the trip leader, the road. Reviews appear on the website once the owner has read them.</p>
        </div>
      </header>
      <section className="m-sec">
        <div className="m-wrap" style={{ maxWidth: 720 }}>
          <ReviewForm name={me.name} booking={tripTitle ? code : ''} />
        </div>
      </section>
    </div>
  )
}
