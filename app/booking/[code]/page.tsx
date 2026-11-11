import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BUSINESS } from '@/lib/config'
import { fmtDate, fmtDateTime, inr } from '@/lib/format'
import { adminClient, writesConfigured } from '@/lib/supabase'
import { ageLabel } from '@/lib/age'
import type { Cab, Passenger, TicketBy } from '@/lib/types'
import { waLink } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Your booking', robots: { index: false, follow: false } }

type Row = {
  code: string; name: string; travellers: number; status: 'held' | 'confirmed' | 'cancelled' | 'expired'
  hold_expires_at: string | null; amount_total: number; amount_advance: number; amount_paid: number
  other_names: string | null; passengers?: Passenger[]; ticket_by?: TicketBy; from_city?: string | null; itinerary_url?: string | null
  departure: { id: string; depart_date: string; start_city?: string; cab?: Cab; trip: { title: string; slug: string; route: string; itinerary_pdf?: string | null } }
}

export default async function BookingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!writesConfigured || !/^LVG-[0-9A-Za-z]{5}$/.test(code)) notFound()
  const { data } = await adminClient()
    .from('bookings')
    .select('*, departure:departures(*, trip:trips(*))') // * keeps working before and after migration 005
    .eq('code', code.toUpperCase())
    .maybeSingle()
  const b = data as unknown as Row | null
  if (!b) notFound()

  const first = b.name.split(' ')[0]
  const lapsed = b.status === 'held' && b.hold_expires_at && new Date(b.hold_expires_at) < new Date()
  const status = lapsed ? 'expired' : b.status
  const trip = b.departure.trip
  const date = fmtDate(b.departure.depart_date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const balance = Math.max(0, b.amount_total - b.amount_paid)
  const itinerary = b.itinerary_url || trip.itinerary_pdf || `/trips/${trip.slug}/itinerary?dl=1&dep=${b.departure.id}`
  const c = b.departure.cab
  const cab = c && (c.vehicle || c.number || c.driver || c.image) ? c : null
  const wa = waLink(`Hi Lavigo, my booking code is ${b.code} for the ${trip.title} on ${fmtDate(b.departure.depart_date, { day: 'numeric', month: 'short', year: 'numeric' })} (${b.travellers} traveller${b.travellers > 1 ? 's' : ''}). Please confirm it and share the payment details for the ${inr(b.amount_advance)} advance.`)

  return (
    <section><div className="wrap" style={{ maxWidth: 760 }}>
      <div className="okhero">
        <div className="okic" style={status === 'held' || status === 'confirmed' ? undefined : { background: '#EEE' }}>
          {status === 'confirmed' ? <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#1E9E6A" strokeWidth="2.6"><path d="M5 12l5 5 9-10" /></svg>
            : status === 'held' ? <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#B5530B" strokeWidth="2.4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            : <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.4"><path d="M6 6l12 12M18 6L6 18" /></svg>}
        </div>
        <h1 style={{ fontSize: 'clamp(26px,5vw,38px)', letterSpacing: '-.02em' }}>
          {status === 'confirmed' ? `You're booked, ${first}!` : status === 'held' ? `Seats held for you, ${first}` : status === 'cancelled' ? 'This booking was cancelled' : 'This hold has expired'}
        </h1>
        <p className="muted" style={{ margin: '8px 0 14px' }}>
          {status === 'held' && b.hold_expires_at && <>One more step: confirm and pay the advance on WhatsApp before <b>{fmtDateTime(b.hold_expires_at)}</b>.</>}
          {status === 'confirmed' && <>Lavigo has confirmed your seats. We will message you on WhatsApp with the details.</>}
          {status === 'expired' && <>The 24-hour hold ended and the seats were released. You can book again, or message us and we will check if seats are still free.</>}
          {status === 'cancelled' && <>If this is a mistake, message us on WhatsApp.</>}
        </p>
        <div className="codebox" aria-label="Booking code">{b.code}</div>
        <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>Keep this code. It is also saved in <a href="/account" style={{ textDecoration: 'underline' }}>My trips</a> when you are signed in.</p>
      </div>

      <div className="card pane">
        <h3 style={{ marginBottom: 12 }}>{trip.title}</h3>
        <table className="brk"><tbody>
          <tr><td>Departure</td><td>{date}</td></tr>
          <tr><td>Route</td><td style={{ textAlign: 'right', fontWeight: 500 }}>{trip.route}</td></tr>
          {b.departure.start_city && <tr><td>Starts from</td><td>{b.departure.start_city}</td></tr>}
          <tr><td>Travellers</td><td>{b.passengers?.length
            ? <ul className="bk-pax">{b.passengers.map((p, i) => <li key={i}><b>{p.name}</b> <span>{p.gender === 'male' ? 'Male' : 'Female'}{p.dob ? ` · ${ageLabel(p.dob, b.departure.depart_date)}` : ''}</span></li>)}</ul>
            : b.travellers}</td></tr>
          {b.ticket_by && b.passengers?.length ? <tr><td>Train / flight tickets</td><td>{b.ticket_by === 'self' ? 'You book them' : `Lavigo books them${b.from_city ? ` from ${b.from_city}` : ''}`}</td></tr> : null}
          <tr><td>Trip total (incl. GST)</td><td>{inr(b.amount_total)}</td></tr>
          <tr><td>Advance to confirm (25%)</td><td>{inr(b.amount_advance)}</td></tr>
          {b.amount_paid > 0 && <tr><td>Paid so far</td><td>{inr(b.amount_paid)}</td></tr>}
          {status === 'confirmed' && <tr className="tot"><td>Balance due before travel</td><td>{inr(balance)}</td></tr>}
        </tbody></table>
      </div>

      {(status === 'held' || status === 'confirmed') && (
        <div className="card pane"><div className="timeline">
          <div className="tl done"><div className="dotc">✓</div><div><b>Seats held</b><small>{b.travellers} seat{b.travellers > 1 ? 's' : ''} reserved for you</small></div></div>
          <div className={'tl ' + (status === 'confirmed' ? 'done' : 'now')}><div className="dotc">{status === 'confirmed' ? '✓' : ''}</div><div><b>Pay the advance on WhatsApp</b><small>{inr(b.amount_advance)} confirms your seats</small></div></div>
          <div className={'tl ' + (status === 'confirmed' ? 'done' : '')}><div className="dotc">{status === 'confirmed' ? '✓' : ''}</div><div><b>Confirmed by Lavigo</b><small>You get a message here and on WhatsApp</small></div></div>
        </div></div>
      )}

      {status === 'confirmed' && cab && (
        <div className="card pane bk-cab">
          {cab.image && <img src={cab.image} alt={cab.vehicle || 'Your cab'} className="bk-cab-pic" />}
          <div>
            <h3 style={{ marginBottom: 6 }}>Your cab</h3>
            <table className="brk"><tbody>
              {cab.vehicle && <tr><td>Vehicle</td><td>{cab.vehicle}</td></tr>}
              {cab.number && <tr><td>Number plate</td><td>{cab.number}</td></tr>}
              {cab.driver && <tr><td>Driver</td><td>{cab.driver}</td></tr>}
              {cab.driver_phone && <tr><td>Driver&apos;s phone</td><td><a href={`tel:+91${cab.driver_phone}`}>{cab.driver_phone}</a></td></tr>}
              {cab.pickup && <tr><td>Pick-up</td><td>{cab.pickup}</td></tr>}
            </tbody></table>
            {cab.note && <p className="muted" style={{ marginTop: 8 }}>{cab.note}</p>}
          </div>
        </div>
      )}

      {(status === 'held' || status === 'confirmed') && <a className="btn b-ghost b-block" style={{ marginBottom: 10 }} href={itinerary} target="_blank" rel="noopener">{b.itinerary_url ? 'Download your personal itinerary (PDF)' : 'Download itinerary (PDF)'}</a>}
      {status === 'held' && <a className="btn b-wa b-block" href={wa} target="_blank" rel="noopener">Confirm on WhatsApp</a>}
      {status === 'confirmed' && <a className="btn b-wa b-block" href={waLink(`Hi Lavigo, a question about my booking ${b.code}.`)} target="_blank" rel="noopener">Message Lavigo on WhatsApp</a>}
      {(status === 'expired' || status === 'cancelled') && <Link className="btn b-main b-block" href={`/trips/${trip.slug}`}>Book this trip again</Link>}
      <p className="muted" style={{ textAlign: 'center', fontSize: 13, marginTop: 14 }}>Questions? Call {BUSINESS.phoneDisplay}.</p>
    </div></section>
  )
}
