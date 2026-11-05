import type { Metadata } from 'next'
import Link from 'next/link'
import { fmtDate, inr } from '@/lib/format'
import { adminClient, writesConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My bookings', robots: { index: false, follow: false } }

const clean = (raw: string) => { let d = raw.replace(/\D/g, ''); if (d.length === 12 && d.startsWith('91')) d = d.slice(2); if (d.length === 11 && d.startsWith('0')) d = d.slice(1); return d }

type Found = { code: string; status: string; travellers: number; amount_total: number; departure: { depart_date: string; trip: { title: string } } }

export default async function MyBookings({ searchParams }: { searchParams: Promise<{ code?: string; phone?: string }> }) {
  const sp = await searchParams
  const code = (sp.code || '').trim().toUpperCase()
  const phone = clean(sp.phone || '')
  const searched = Boolean(sp.code || sp.phone)
  let found: Found | null = null

  if (searched && writesConfigured && /^LVG-[0-9A-Z]{5}$/.test(code) && /^[6-9]\d{9}$/.test(phone)) {
    const { data } = await adminClient()
      .from('bookings')
      .select('code,status,travellers,amount_total,departure:departures(depart_date,trip:trips(title))')
      .eq('code', code).eq('phone', phone).maybeSingle()
    found = data as unknown as Found | null
  }

  return (
    <section><div className="wrap" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 'clamp(28px,4.5vw,38px)', letterSpacing: '-.02em', marginBottom: 6 }}>My bookings</h1>
      <p className="muted" style={{ marginBottom: 18 }}>Enter your booking code and the phone number you booked with.</p>
      <form className="card pane" method="get">
        <div className="fld"><label htmlFor="mb-code">Booking code</label><input id="mb-code" name="code" className="inp" placeholder="LVG-XXXXX" defaultValue={sp.code} required autoCapitalize="characters" /></div>
        <div className="fld"><label htmlFor="mb-phone">Phone number</label><input id="mb-phone" name="phone" className="inp" inputMode="numeric" placeholder="10-digit mobile number" defaultValue={sp.phone} required /></div>
        <button className="btn b-main b-block">Find my booking</button>
      </form>
      {searched && !found && <div className="errbox" role="alert">We could not find a booking with that code and number. Check both and try again, or message us on WhatsApp.</div>}
      {found && (
        <Link href={`/booking/${found.code}`} className="card pane" style={{ display: 'block' }}>
          <div className="between"><b>{found.departure.trip.title}</b><span className={'pill ' + found.status}>{found.status}</span></div>
          <p className="muted" style={{ marginTop: 6 }}>{fmtDate(found.departure.depart_date, { day: 'numeric', month: 'long', year: 'numeric' })} · {found.travellers} traveller{found.travellers > 1 ? 's' : ''} · {inr(found.amount_total)}</p>
          <p style={{ marginTop: 8, fontWeight: 600 }}>View booking {found.code} →</p>
        </Link>
      )}
    </div></section>
  )
}
