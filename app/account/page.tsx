import type { Metadata } from 'next'
import Link from 'next/link'
import { signOutCustomer } from '@/app/actions/account'
import { PasswordForm, ProfileForm } from '@/components/AccountForms'
import { Icon } from '@/components/Icons'
import { ageLabel } from '@/lib/age'
import { requireCustomer } from '@/lib/customer'
import { fmtDate, inr } from '@/lib/format'
import { adminClient, writesConfigured } from '@/lib/supabase'
import type { Passenger } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My trips', robots: { index: false, follow: false } }

type Row = {
  id: string; code: string; status: 'held' | 'confirmed' | 'cancelled' | 'expired'; travellers: number
  hold_expires_at: string | null; amount_total: number; amount_paid: number; amount_advance: number
  passengers?: Passenger[]; itinerary_url?: string | null
  departure: { id: string; depart_date: string; start_city?: string; trip: { title: string; slug: string; image: string | null; itinerary_pdf?: string | null } }
}

const LABEL: Record<string, string> = { held: 'Waiting for advance', confirmed: 'Confirmed', cancelled: 'Cancelled', expired: 'Hold expired' }

export default async function Account({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const sp = await searchParams
  const me = await requireCustomer('/account')
  let rows: Row[] = []
  let reviewed = new Set<string>()
  if (writesConfigured) {
    const sb = adminClient()
    const { data, error } = await sb.from('bookings')
      .select('*, departure:departures(id,depart_date,start_city,trip:trips(*))')
      .eq('user_id', me.id).order('created_at', { ascending: false })
    if (!error) rows = (data ?? []) as unknown as Row[]
    const r = await sb.from('reviews').select('booking_id').eq('user_id', me.id)
    if (!r.error) reviewed = new Set((r.data ?? []).map((x) => x.booking_id as string).filter(Boolean))
  }
  const now = new Date()
  const status = (b: Row) => (b.status === 'held' && b.hold_expires_at && new Date(b.hold_expires_at) < now ? 'expired' : b.status)
  const today = now.toISOString().slice(0, 10)
  const upcoming = rows.filter((b) => b.departure.depart_date >= today && status(b) !== 'cancelled' && status(b) !== 'expired')
  const rest = rows.filter((b) => !upcoming.includes(b))

  const card = (b: Row) => {
    const st = status(b)
    const pdf = b.itinerary_url || b.departure.trip.itinerary_pdf || `/trips/${b.departure.trip.slug}/itinerary?dl=1&dep=${b.departure.id}`
    const past = b.departure.depart_date < today
    return (
      <article key={b.id} className="ac-trip">
        <div className="ac-trip-pic" style={b.departure.trip.image ? { backgroundImage: `url(${b.departure.trip.image})` } : undefined} aria-hidden="true" />
        <div className="ac-trip-b">
          <div className="ac-trip-top">
            <span className={'ac-pill ' + st}>{LABEL[st]}</span>
            <span className="ac-code">{b.code}</span>
          </div>
          <h3>{b.departure.trip.title}</h3>
          <p className="ac-meta">{fmtDate(b.departure.depart_date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}{b.departure.start_city ? ` · from ${b.departure.start_city}` : ''}</p>
          {b.passengers?.length ? (
            <ul className="ac-pax">
              {b.passengers.map((p, i) => <li key={i}><b>{p.name}</b><span>{p.gender === 'male' ? 'Male' : 'Female'} · {ageLabel(p.dob, b.departure.depart_date)}</span></li>)}
            </ul>
          ) : <p className="ac-meta">{b.travellers} traveller{b.travellers > 1 ? 's' : ''}</p>}
          <div className="ac-money">
            <span>Total <b>{inr(b.amount_total)}</b></span>
            <span>Paid <b>{inr(b.amount_paid)}</b></span>
            {st === 'confirmed' && b.amount_total > b.amount_paid && <span>Balance <b>{inr(b.amount_total - b.amount_paid)}</b></span>}
          </div>
          <div className="ac-acts">
            <Link href={`/booking/${b.code}`} className="ac-btn">Booking details</Link>
            {(st === 'held' || st === 'confirmed') && <a href={pdf} target="_blank" rel="noopener" className="ac-btn ghost"><Icon name="download" size={16} /> Itinerary{b.itinerary_url ? ' (yours)' : ''}</a>}
            {st === 'confirmed' && past && !reviewed.has(b.id) && <Link href={`/reviews/new?booking=${b.code}`} className="ac-btn ghost"><Icon name="star" size={16} /> Review this trip</Link>}
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className="ac-page">
      <div className="m-wrap">
        <div className="ac-head">
          <div>
            <p className="lv-eyebrow">My Lavigo</p>
            <h1 className="ac-h">Hello{me.name ? `, ${me.name.split(' ')[0]}` : ''}.</h1>
            <p className="ac-sub">Signed in as {me.email}</p>
          </div>
          <div className="ac-head-acts">
            <Link href="/trips" className="lv-pill">Book a trip <span aria-hidden="true"><Icon name="arrow" size={16} /></span></Link>
            <form action={signOutCustomer}><button className="ac-btn ghost" type="submit"><Icon name="logout" size={16} /> Sign out</button></form>
          </div>
        </div>

        {sp.reset && <div className="ac-box"><h2 className="ac-h2">Set a new password</h2><PasswordForm /></div>}

        <div className="ac-grid">
          <div>
            <h2 className="ac-h2">Upcoming trips</h2>
            {upcoming.length ? upcoming.map(card) : (
              <div className="ac-empty"><b>No upcoming trips yet.</b><span>Pick a group departure or plan a private trip, and it will appear here.</span><Link href="/trips" className="ac-btn">See departures</Link></div>
            )}
            {rest.length > 0 && <><h2 className="ac-h2" style={{ marginTop: 34 }}>Past and other bookings</h2>{rest.map(card)}</>}
            <p className="ac-fine">Booked before you had an account? <Link href="/my-bookings">Find it with your booking code</Link>.</p>
          </div>
          <aside className="ac-box">
            <h2 className="ac-h2">Your details</h2>
            <ProfileForm name={me.name} phone={me.phone} />
            <hr className="ac-hr" />
            <p className="ac-fine"><Link href="/reviews/new">Write a review of Lavigo</Link> · <Link href="/plan">Plan a private trip</Link></p>
          </aside>
        </div>
      </div>
    </div>
  )
}
