import Link from 'next/link'
import { confirmBooking, cancelBooking, recordPayment } from '../actions'
import { ConfirmButton } from '@/components/admin/ConfirmButton'
import { bookingStats, listBookings } from '@/lib/admin-data'
import { fmtDate, fmtDateTime, inr } from '@/lib/format'

const FILTERS = [['active', 'Active'], ['held', 'Awaiting payment'], ['confirmed', 'Confirmed'], ['expired', 'Expired'], ['cancelled', 'Cancelled'], ['all', 'All']] as const

export default async function Bookings({ searchParams }: { searchParams: Promise<{ status?: string; err?: string; ok?: string }> }) {
  const sp = await searchParams
  const filter = FILTERS.some(([k]) => k === sp.status) ? sp.status! : 'active'
  const [rows, st] = await Promise.all([listBookings(filter), bookingStats()])
  const now = Date.now()

  return (
    <>
      <h1>Bookings</h1>
      <p className="muted" style={{ marginBottom: 14 }}>Customers hold seats on the website. When they pay on WhatsApp, tap <b>Confirm</b> and enter the amount received.</p>
      {sp.err && <div className="errbox" role="alert">{sp.err}</div>}
      {sp.ok && <div className="okbox" role="status">{sp.ok}</div>}

      <div className="stats" style={{ marginBottom: 18 }}>
        <div className="card stat"><small>Awaiting payment</small><b>{st.waiting}</b><em style={{ color: 'var(--warn)' }}>{st.waitingSeats} seats on hold</em></div>
        <div className="card stat"><small>Confirmed bookings</small><b>{st.confirmed}</b><em>{st.seatsSold} seats on upcoming trips</em></div>
        <div className="card stat"><small>Money received</small><b>{inr(st.received)}</b><em>all confirmed bookings</em></div>
        <div className="card stat"><small>Balance still due</small><b>{inr(st.balanceDue)}</b><em style={{ color: 'var(--muted)' }}>from confirmed bookings</em></div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {FILTERS.map(([k, l]) => <Link key={k} href={`/admin?status=${k}`} className={'btn sm ' + (k === filter ? 'b-main' : 'b-ghost')}>{l}</Link>)}
      </div>

      <div className="card tbl-scroll">
        <table>
          <thead><tr><th>Booking</th><th>Customer</th><th>Trip</th><th>Seats</th><th>Money</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="muted" style={{ padding: 24, textAlign: 'center' }}>No bookings here yet.</td></tr>}
            {rows.map((b) => {
              const lapsed = b.status === 'held' && b.hold_expires_at && new Date(b.hold_expires_at).getTime() < now
              const st2 = lapsed ? 'expired' : b.status
              const bal = Math.max(0, b.amount_total - b.amount_paid)
              return (
                <tr key={b.id}>
                  <td><b>{b.code}</b><div className="muted" style={{ fontSize: 12 }}>{fmtDateTime(b.created_at)}</div></td>
                  <td>{b.name}<div><a href={`https://wa.me/91${b.phone}?text=${encodeURIComponent(`Hi ${b.name.split(' ')[0]}, this is Lavigo about your booking ${b.code}.`)}`} target="_blank" rel="noopener" style={{ color: 'var(--ok)', fontWeight: 600 }}>{b.phone} ↗</a></div></td>
                  <td>{b.departure.trip.title}<div className="muted" style={{ fontSize: 12 }}>{fmtDate(b.departure.depart_date, { day: 'numeric', month: 'short', year: 'numeric' })}</div></td>
                  <td>{b.travellers}</td>
                  <td>{inr(b.amount_total)}<div className="muted" style={{ fontSize: 12 }}>advance {inr(b.amount_advance)}{b.amount_paid > 0 && <> · paid {inr(b.amount_paid)}</>}</div></td>
                  <td><span className={'pill ' + st2}>{st2 === 'held' ? 'awaiting payment' : st2}</span>{st2 === 'held' && b.hold_expires_at && <div className="muted" style={{ fontSize: 12 }}>until {fmtDateTime(b.hold_expires_at)}</div>}</td>
                  <td style={{ minWidth: 230 }}>
                    {(b.status === 'held' || b.status === 'expired') && (
                      <form action={confirmBooking} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input type="hidden" name="id" value={b.id} />
                        <input className="inp sm" name="amount" type="number" min={0} defaultValue={b.amount_advance} aria-label="Amount received (₹)" style={{ width: 96 }} />
                        <button className="btn b-main sm">Confirm</button>
                      </form>
                    )}
                    {b.status === 'confirmed' && bal > 0 && (
                      <form action={recordPayment} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input type="hidden" name="id" value={b.id} />
                        <input className="inp sm" name="amount" type="number" min={1} max={bal} defaultValue={bal} aria-label="Payment received (₹)" style={{ width: 96 }} />
                        <button className="btn b-ghost sm">Add payment</button>
                      </form>
                    )}
                    {b.status !== 'cancelled' && (
                      <form action={cancelBooking}><input type="hidden" name="id" value={b.id} /><ConfirmButton className="btn b-danger sm" message={`Cancel booking ${b.code} and release its ${b.travellers} seat(s)?`}>Cancel booking</ConfirmButton></form>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
