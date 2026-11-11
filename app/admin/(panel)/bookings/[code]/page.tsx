import Link from 'next/link'
import { notFound } from 'next/navigation'
import { addPayment, cancelBooking, confirmBooking, extendHold, moveBooking, setBookingItinerary, updateBooking } from '../../../actions'
import { FileField } from '@/components/admin/FileField'
import { ConfirmButton } from '@/components/admin/ConfirmButton'
import { PassengerEditor } from '@/components/admin/PassengerEditor'
import { Flash, Head, PayPill, StatusPill, dDay, dShort, money, rel, waTo, when } from '@/components/admin/ui'
import { Icon } from '@/components/Icons'
import { bookableDepartures, getBooking, getDeparture, isLiveHold, takesSeats, travellersOf } from '@/lib/admin-data'
import { HOLD_HOURS, SITE_URL } from '@/lib/config'
import type { PayMethod } from '@/lib/types'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  return { title: (await params).code.toUpperCase() }
}

const METHOD: Record<PayMethod, string> = { upi: 'UPI', cash: 'Cash', bank: 'Bank transfer', card: 'Card', other: 'Other' }
function MethodSelect() {
  return (
    <select className="inp" name="method" defaultValue="upi" aria-label="Paid by">
      {(Object.keys(METHOD) as PayMethod[]).map((m) => <option key={m} value={m}>{METHOD[m]}</option>)}
    </select>
  )
}

export default async function BookingPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [{ code }, sp] = await Promise.all([params, searchParams])
  const found = await getBooking(code)
  if (!found) notFound()
  const { booking: b, payments } = found
  const [dep, others] = await Promise.all([getDeparture(b.departure_id), bookableDepartures()])
  const here = `/admin/bookings/${b.code}`
  const trav = travellersOf(b)
  const live = isLiveHold(b)
  const active = takesSeats(b)
  const lapsed = b.status === 'expired' || (b.status === 'held' && !live)
  const balance = Math.max(0, b.amount_total - b.amount_paid)
  const perPerson = Math.round(b.amount_total / b.travellers)
  const seatsFree = dep ? dep.stats.seatsLeft + (active ? b.travellers : 0) : b.travellers
  const trip = b.departure.trip
  const date = dDay(b.departure.depart_date)
  const itin = `${SITE_URL}/trips/${trip.slug}/itinerary?dep=${b.departure.id}`
  const bookingUrl = `${SITE_URL}/booking/${b.code}`
  const first = b.name.split(' ')[0]
  const msgs = {
    hold: `Hi ${first}, this is Lavigo Travel Co. Your booking ${b.code} for ${trip.title} on ${date} (${b.travellers} traveller${b.travellers > 1 ? 's' : ''}) is on hold${b.hold_expires_at ? ` until ${when(b.hold_expires_at)}` : ''}. Please pay the advance of ${money(b.amount_advance)} to confirm your seats. Booking details: ${bookingUrl}`,
    confirmed: `Hi ${first}, your Lavigo booking ${b.code} for ${trip.title} on ${date} is confirmed. We have received ${money(b.amount_paid)}${balance ? `; the balance of ${money(balance)} is due before you travel` : ', paid in full'}. Your day-by-day itinerary: ${itin}`,
    balance: `Hi ${first}, a reminder from Lavigo Travel Co.: the balance of ${money(balance)} for booking ${b.code} (${trip.title}, ${date}) is due before departure. Thank you!`,
  }
  const moveTo = others.filter((d) => d.id !== b.departure_id && d.stats.seatsLeft >= b.travellers)

  return (
    <>
      <Head back={{ href: '/admin/bookings', label: 'Bookings' }}
        title={<>{b.code} <span style={{ fontSize: 16, verticalAlign: 'middle', marginLeft: 6 }}><StatusPill b={b} /></span></>}
        sub={<>{b.source === 'admin' ? 'Added by you' : b.user_id ? `Booked on the website by ${b.email ?? 'a signed-in customer'}` : 'Booked on the website'} {rel(b.created_at)} · {trip.title}, {date}</>}>
        <a className="btn b-wa" href={waTo(b.phone)} target="_blank" rel="noopener"><Icon name="phone" size={16} />WhatsApp {first}</a>
        <a className="btn b-ghost" href={`tel:+91${b.phone}`}>Call</a>
        <a className="btn b-ghost" href={`/trips/${trip.slug}/itinerary?dep=${b.departure.id}`} target="_blank" rel="noopener"><Icon name="download" size={16} />Itinerary</a>
      </Head>
      <Flash ok={sp.ok} err={sp.err} />

      <div className="ad-detail">
        <div>
          {/* ───── travellers & contact (editable) ───── */}
          <form action={updateBooking} className="card pane">
            <input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={here} />
            <h2 className="ad-h2">Travellers</h2>
            <p className="ad-sub">Edit names, genders and dates of birth (children up to 11 pay 60%), tick &quot;ID checked&quot; once you have seen each photo ID, or add and remove travellers. Adding someone needs a free seat ({seatsFree - b.travellers} left on this date); the total changes at {money(perPerson)} per person unless you set it below.</p>
            {b.status === 'cancelled' ? (
              <ul className="ad-pay">{trav.map((t, i) => <li key={i}><span>{i + 1}. {t.name}</span><span className={'gx ' + (t.gender ?? 'unknown')}>{t.gender === 'male' ? 'M' : t.gender === 'female' ? 'F' : '?'}</span></li>)}</ul>
            ) : (
              <PassengerEditor initial={trav.map((t) => ({ name: t.name, gender: t.gender ?? '', dob: t.dob, id_checked: t.idChecked }))} max={Math.max(b.travellers, seatsFree)} day={b.departure.depart_date} />
            )}
            {trav.some((t) => !t.gender) && b.status !== 'cancelled' && <p className="hint" style={{ color: 'var(--warn)' }}>This booking was made before genders were asked. Choose male or female for each traveller, then save.</p>}

            <h2 className="ad-h2" style={{ marginTop: 22 }}>Contact &amp; tickets</h2>
            <div className="g2" style={{ marginTop: 10 }}>
              <div className="fld"><label className="l" htmlFor="b-phone">Mobile (WhatsApp)</label><input id="b-phone" className="inp" name="phone" defaultValue={b.phone} inputMode="numeric" required disabled={b.status === 'cancelled'} /></div>
              <div className="fld"><label className="l" htmlFor="b-email">Email</label><input id="b-email" className="inp" name="email" type="email" defaultValue={b.email ?? ''} disabled={b.status === 'cancelled'} /></div>
            </div>
            <div className="g2">
              <div className="fld"><label className="l" htmlFor="b-tk">Train / flight tickets</label>
                <select id="b-tk" className="inp" name="ticket_by" defaultValue={b.ticket_by ?? 'agency'} disabled={b.status === 'cancelled'}>
                  <option value="agency">Lavigo books them</option><option value="self">Traveller books their own</option>
                </select></div>
              <div className="fld"><label className="l" htmlFor="b-from">Travelling from (if Lavigo books)</label><input id="b-from" className="inp" name="from_city" defaultValue={b.from_city ?? ''} placeholder="e.g. Patna" disabled={b.status === 'cancelled'} /></div>
            </div>
            <div className="g2">
              <div className="fld"><label className="l" htmlFor="b-total">Total price (₹)</label><input id="b-total" className="inp" name="amount_total" inputMode="numeric" placeholder={String(b.amount_total)} disabled={b.status === 'cancelled'} />
                <p className="hint">Now {money(b.amount_total)} ({money(perPerson)} × {b.travellers}). Enter a new total only to give a discount or extra charge.</p></div>
              <div className="fld"><label className="l" htmlFor="b-note">Private note (only you see this)</label><textarea id="b-note" className="inp" name="admin_note" defaultValue={b.admin_note ?? ''} placeholder="e.g. Wants a window seat; vegetarian meals" style={{ minHeight: 80 }} disabled={b.status === 'cancelled'} /></div>
            </div>
            {b.status !== 'cancelled' && <button className="btn b-main">Save changes</button>}
          </form>

          {/* ───── trip & date ───── */}
          <div className="card pane">
            <h2 className="ad-h2">Trip</h2>
            <dl className="ad-kv" style={{ marginTop: 10 }}>
              <dt>Trip</dt><dd><Link href={`/admin/trips/${trip.id}`} style={{ color: 'var(--ink3)' }}>{trip.title}</Link></dd>
              <dt>Departure</dt><dd><Link href={`/admin/departures/${b.departure.id}`} style={{ color: 'var(--ink3)' }}>{date}</Link>{dep ? <span className="muted"> · {dep.stats.seatsLeft} seats left</span> : null}</dd>
              <dt>Starts from</dt><dd>{b.departure.start_city ?? 'Ranchi'}</dd>
              <dt>Price agreed</dt><dd>{money(perPerson)} per person{perPerson !== b.departure.price ? <span className="muted"> (list price {money(b.departure.price)})</span> : null}</dd>
            </dl>
            {b.status !== 'cancelled' && (
              <details className="ad-details" style={{ marginTop: 16 }}>
                <summary><Icon name="calendar" size={16} />Move to another date</summary>
                {moveTo.length === 0 ? <p className="muted">No other open departure has {b.travellers} free seat{b.travellers > 1 ? 's' : ''}.</p> : (
                  <form action={moveBooking} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={here} />
                    <select className="inp" name="departure_id" required style={{ flex: 1, minWidth: 240 }} aria-label="New departure">
                      <option value="">Choose a departure…</option>
                      {moveTo.map((d) => <option key={d.id} value={d.id}>{dShort(d.depart_date)} · {d.trip.title} · {d.stats.seatsLeft} left</option>)}
                    </select>
                    <ConfirmButton className="btn b-main" message={`Move ${b.code} to the chosen date? Seats are moved too; the price stays the same.`}>Move booking</ConfirmButton>
                  </form>
                )}
              </details>
            )}
          </div>

          {/* ───── personal itinerary ───── */}
          <form action={setBookingItinerary} className="card pane" id="itinerary">
            <input type="hidden" name="booking_id" value={b.id} /><input type="hidden" name="back" value={here + '#itinerary'} />
            <h2 className="ad-h2">Itinerary for {first}</h2>
            <p className="ad-sub">Upload a personal PDF (rooming list, tickets, special plan) just for this booking. The customer downloads it from their booking page and My trips. Without one they get the trip&apos;s itinerary.</p>
            <FileField name="itinerary_url" value={b.itinerary_url ?? ''} kind="pdf" label="Personal itinerary" />
            <button className="btn b-main" style={{ marginTop: 12 }}>Save itinerary</button>
          </form>

          {/* ───── payments ───── */}
          <div className="card pane">
            <h2 className="ad-h2">Payments</h2>
            {payments === null ? (
              <p className="ad-sub">The payment history needs the latest database update (006_admin_console.sql). Totals below still work.</p>
            ) : payments.length === 0 ? (
              <p className="ad-sub">Nothing recorded yet.</p>
            ) : (
              <ul className="ad-pay" style={{ marginTop: 8 }}>
                {payments.map((p) => (
                  <li key={p.id}>
                    <span><b className={p.amount < 0 ? 'neg' : undefined}>{p.amount < 0 ? `Refund ${money(-p.amount)}` : money(p.amount)}</b> <span className="muted">· {METHOD[p.method]}{p.note ? ` · ${p.note}` : ''}</span></span>
                    <span className="muted">{when(p.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
            {(b.status === 'confirmed' || (b.status === 'cancelled' && b.amount_paid > 0)) && (
              <form action={addPayment} style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 2fr auto', gap: 8, alignItems: 'center' }} className="ad-payform">
                <input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={here} />
                <select className="inp" name="kind" defaultValue={b.status === 'cancelled' ? 'refund' : 'payment'} aria-label="Payment or refund">
                  {b.status === 'confirmed' && <option value="payment">Received</option>}
                  <option value="refund">Refunded</option>
                </select>
                <input className="inp" name="amount" inputMode="numeric" placeholder={b.status === 'confirmed' && balance ? String(balance) : 'Amount'} required aria-label="Amount (₹)" />
                <MethodSelect />
                <input className="inp" name="note" placeholder="Note, e.g. UPI ref" maxLength={200} aria-label="Note" />
                <button className="btn b-main">Record</button>
              </form>
            )}
          </div>
        </div>

        {/* ───── right column: money + actions ───── */}
        <div className="ad-sticky">
          <div className="card ad-money">
            <small className="muted" style={{ fontWeight: 600 }}>Total</small>
            <div className="big">{money(b.amount_total)}</div>
            <div className="bar"><i style={{ width: `${b.amount_total ? Math.min(100, (b.amount_paid / b.amount_total) * 100) : 0}%` }} /></div>
            <div className="row"><span>Received</span><b>{money(b.amount_paid)}</b></div>
            <div className="row"><span>Balance</span><b>{money(balance)}</b></div>
            <div className="row muted"><span>Advance to confirm (25%)</span><b>{money(b.amount_advance)}</b></div>
            {b.status === 'confirmed' && <div style={{ marginTop: 6 }}><PayPill b={b} /></div>}
          </div>

          {(b.status === 'held' || b.status === 'expired') && (
            <form action={confirmBooking} className="card pane" style={{ marginTop: 14 }}>
              <input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={here} />
              <h2 className="ad-h2">Confirm booking</h2>
              <p className="ad-sub">{live ? `Hold lapses ${rel(b.hold_expires_at!)} (${when(b.hold_expires_at!)}).` : 'The hold has lapsed. You can still confirm if the seats are free.'}</p>
              <div className="fld"><label className="l" htmlFor="c-amt">Amount received (₹)</label><input id="c-amt" className="inp" name="amount" inputMode="numeric" defaultValue={b.amount_advance} required /></div>
              <div className="g2"><div className="fld"><label className="l">Paid by</label><MethodSelect /></div><div className="fld"><label className="l" htmlFor="c-note">Note</label><input id="c-note" className="inp" name="note" placeholder="UPI ref" /></div></div>
              <button className="btn b-main b-block lg"><Icon name="check" size={18} />Confirm &amp; record</button>
            </form>
          )}
          {(b.status === 'held' || lapsed) && (
            <div className="card pane" style={{ marginTop: 14 }}>
              <h2 className="ad-h2" style={{ fontSize: 17 }}>Give more time</h2>
              <p className="ad-sub">Keeps the seats blocked while the customer arranges payment.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[24, 72, 168].map((h) => (
                  <form action={extendHold} key={h}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={here} /><input type="hidden" name="hours" value={h} />
                    <button className="btn b-ghost sm">+{h / 24} day{h > 24 ? 's' : ''}</button></form>
                ))}
              </div>
            </div>
          )}

          <div className="card pane" style={{ marginTop: 14 }}>
            <h2 className="ad-h2" style={{ fontSize: 17 }}>Message the customer</h2>
            <p className="ad-sub">Opens WhatsApp with the message written. Nothing is sent until you press send.</p>
            <div className="ad-quick">
              {(b.status === 'held' || lapsed) && <a className="btn b-ghost b-block" href={waTo(b.phone, msgs.hold)} target="_blank" rel="noopener">Payment reminder</a>}
              {b.status === 'confirmed' && <a className="btn b-ghost b-block" href={waTo(b.phone, msgs.confirmed)} target="_blank" rel="noopener">Send confirmation + itinerary</a>}
              {b.status === 'confirmed' && balance > 0 && <a className="btn b-ghost b-block" href={waTo(b.phone, msgs.balance)} target="_blank" rel="noopener">Balance reminder</a>}
              <a className="btn b-ghost b-block" href={`/booking/${b.code}`} target="_blank" rel="noopener">Customer&apos;s booking page</a>
            </div>
          </div>

          <div className="card pane" style={{ marginTop: 14 }}>
            <h2 className="ad-h2" style={{ fontSize: 17, marginBottom: 12 }}>History</h2>
            <ul className="ad-tl">
              <li><b>Booked</b> {b.source === 'admin' ? 'by you' : 'on the website'} · {when(b.created_at)}</li>
              {b.status === 'held' && b.hold_expires_at && <li><b>{live ? 'Hold lapses' : 'Hold lapsed'}</b> · {when(b.hold_expires_at)}</li>}
              {b.status === 'expired' && <li><b>Hold lapsed</b> · seats released</li>}
              {b.confirmed_at && <li><b>Confirmed</b> · {when(b.confirmed_at)}</li>}
              {payments?.map((p) => <li key={p.id}><b>{p.amount < 0 ? 'Refund' : 'Payment'} {money(Math.abs(p.amount))}</b> · {when(p.created_at)}</li>)}
              {b.cancelled_at && <li><b>Cancelled</b> · {when(b.cancelled_at)}</li>}
            </ul>
          </div>

          {b.status !== 'cancelled' && (
            <form action={cancelBooking} style={{ marginTop: 14 }}>
              <input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={here} />
              <ConfirmButton className="btn b-danger b-block" message={`Cancel ${b.code} for ${b.name}? The ${b.travellers} seat${b.travellers > 1 ? 's' : ''} go back on sale. You can record a refund afterwards.`}>Cancel booking</ConfirmButton>
            </form>
          )}
          <p className="hint" style={{ textAlign: 'center', marginTop: 10 }}>Website holds last {HOLD_HOURS} hours.</p>
        </div>
      </div>
    </>
  )
}
