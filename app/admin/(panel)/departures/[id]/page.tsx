import { Fragment } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { deleteDeparture } from '../../../actions'
import { ConfirmButton } from '@/components/admin/ConfirmButton'
import { DepartureForm } from '@/components/admin/DepartureForm'
import { PrintButton } from '@/components/admin/PrintButton'
import { Icon } from '@/components/Icons'
import { Flash, Head, PayPill, StatusPill, dDay, money, rel } from '@/components/admin/ui'
import { getDeparture, isLiveHold, takesSeats, travellersOf } from '@/lib/admin-data'
import { ageOn, isChild } from '@/lib/age'
import { daysTo } from '@/lib/format'

export const metadata = { title: 'Departure' }

export default async function DeparturePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const found = await getDeparture(id)
  if (!found) notFound()
  const { departure: d, bookings, stats: s } = found
  const here = `/admin/departures/${d.id}`
  const travelling = bookings.filter(takesSeats).sort((a, b) => Number(isLiveHold(a)) - Number(isLiveHold(b)) || a.created_at.localeCompare(b.created_at))
  const notTravelling = bookings.filter((b) => !takesSeats(b))
  const ticketsToBook = travelling.filter((b) => b.ticket_by === 'agency' && b.passengers?.length)
  const fromCities = new Map<string, number>()
  for (const b of ticketsToBook) fromCities.set(b.from_city || 'Not given', (fromCities.get(b.from_city || 'Not given') ?? 0) + b.travellers)
  const days = daysTo(d.depart_date)
  const all = travelling.flatMap((b) => travellersOf(b))
  const ages = all.map((x) => ageOn(x.dob, d.depart_date))
  const kids = ages.filter((a) => isChild(a)).length
  const adults = ages.filter((a) => a !== null && !isChild(a)).length
  const noAge = ages.filter((a) => a === null).length
  const cab = d.cab && (d.cab.vehicle || d.cab.number || d.cab.driver) ? d.cab : null
  let n = 0

  return (
    <>
      <Head back={{ href: '/admin/departures', label: 'Departures' }} title={d.trip.title}
        sub={<>{dDay(d.depart_date)} · from {d.start_city} · {d.trip.nights}N/{d.trip.nights + 1}D · {money(d.price)} per person · {days > 0 ? `in ${days} days` : days === 0 ? 'today' : 'completed'}</>}>
        <Link href={`/admin/bookings/new?departure=${d.id}`} className="btn b-main"><Icon name="plus" size={16} />Add booking</Link>
        <a href={`/admin/export/manifest?departure=${d.id}`} className="btn b-ghost"><Icon name="download" size={16} />CSV</a>
        <PrintButton />
        <a href={`/trips/${d.trip.slug}/itinerary?dep=${d.id}`} target="_blank" rel="noopener" className="btn b-ghost">Itinerary</a>
      </Head>
      <Flash ok={sp.ok} err={sp.err} />

      <div className="ad-sum">
        <div><small>Total seats</small><b>{d.seats_total}</b></div>
        <div><small>Confirmed</small><b>{s.confirmedSeats}</b></div>
        <div><small>On hold</small><b>{s.heldSeats}</b></div>
        <div><small>Seats left</small><b>{s.seatsLeft}</b></div>
        <div className="m"><small>Male</small><b>{s.genders.male}</b></div>
        <div className="f"><small>Female</small><b>{s.genders.female}{s.genders.unknown ? <span style={{ fontSize: 13, color: 'var(--muted)' }}> +{s.genders.unknown} ?</span> : null}</b></div>
        <div><small>Adults</small><b>{adults}</b></div>
        <div><small>Children</small><b>{kids}{noAge ? <span style={{ fontSize: 13, color: 'var(--muted)' }}> · {noAge} no age</span> : null}</b></div>
      </div>
      {cab && <p className="ad-cabline"><Icon name="car" size={16} /> Cab: <b>{[cab.vehicle, cab.number].filter(Boolean).join(' · ')}</b>{cab.driver ? <> · driver {cab.driver}{cab.driver_phone ? <> (<a href={`tel:+91${cab.driver_phone}`}>{cab.driver_phone}</a>)</> : null}</> : null}{cab.pickup ? <> · {cab.pickup}</> : null} <a href="#cab" className="ad-noprint">Change</a></p>}

      <div className="ad-2col ad-noprint" style={{ marginBottom: 18 }}>
        <div className="card pane">
          <h2 className="ad-h2" style={{ fontSize: 17 }}>Money</h2>
          <dl className="ad-kv" style={{ marginTop: 8 }}>
            <dt>Confirmed value</dt><dd>{money(s.revenue)}</dd>
            <dt>Received</dt><dd>{money(s.received)}</dd>
            <dt>Balance due</dt><dd>{money(s.due)}</dd>
          </dl>
        </div>
        <div className="card pane">
          <h2 className="ad-h2" style={{ fontSize: 17 }}>Tickets Lavigo books</h2>
          {ticketsToBook.length === 0 ? <p className="ad-sub" style={{ margin: '8px 0 0' }}>Nobody on this departure asked Lavigo to book train or flight tickets.</p> : (
            <dl className="ad-kv" style={{ marginTop: 8 }}>
              {[...fromCities.entries()].map(([c, k]) => <Fragment key={c}><dt>From {c}</dt><dd>{k} traveller{k > 1 ? 's' : ''}</dd></Fragment>)}
            </dl>
          )}
        </div>
      </div>

      <h2 className="ad-h2">Traveller list</h2>
      <p className="ad-sub">Everyone who has a seat: confirmed bookings first, then holds still waiting for payment.</p>
      <div className="card ad-scroll">
        {travelling.length === 0 ? <div className="ad-empty"><b>No travellers yet</b>Bookings from the website and the ones you add appear here.</div> : (
          <table className="ad-tbl">
            <thead><tr><th>#</th><th>Traveller</th><th>Gender</th><th>Age</th><th>ID</th><th>Booking</th><th>Lead phone</th><th>Tickets</th><th className="num">Paid / total</th></tr></thead>
            <tbody>
              {travelling.flatMap((b) => {
                const t = travellersOf(b)
                return t.map((x, i) => (
                  <tr key={b.id + i}>
                    <td className="muted">{++n}</td>
                    <td><b style={{ fontWeight: x.lead ? 700 : 500 }}>{x.name}</b>{x.lead && t.length > 1 ? <small>lead · group of {t.length}</small> : null}{i === 0 && b.admin_note ? <small title="Private note">Note: {b.admin_note}</small> : null}</td>
                    <td><span className={'gx ' + (x.gender ?? 'unknown')}>{x.gender === 'male' ? 'M' : x.gender === 'female' ? 'F' : '?'}</span></td>
                    <td>{(() => { const a = ageOn(x.dob, d.depart_date); return a === null ? <span className="muted">—</span> : <>{a}{isChild(a) && <span className="ad-kid">child</span>}</> })()}</td>
                    <td>{x.idChecked ? <span className="ad-idok" title="ID checked">✓</span> : <span className="muted">—</span>}</td>
                    {i === 0 ? (
                      <>
                        <td rowSpan={t.length}><Link href={`/admin/bookings/${b.code}`} className="ad-code">{b.code}</Link><div style={{ marginTop: 4 }}><StatusPill b={b} /></div>{isLiveHold(b) && <small>lapses {rel(b.hold_expires_at!)}</small>}</td>
                        <td rowSpan={t.length}><a href={`tel:+91${b.phone}`}>{b.phone}</a></td>
                        <td rowSpan={t.length}>{b.ticket_by === 'self' ? 'Own' : b.passengers?.length ? <>Lavigo{b.from_city ? <small>from {b.from_city}</small> : null}</> : <span className="muted">—</span>}</td>
                        <td rowSpan={t.length} className="num">{money(b.amount_paid)} / {money(b.amount_total)}{b.status === 'confirmed' && <div style={{ marginTop: 4 }}><PayPill b={b} /></div>}</td>
                      </>
                    ) : null}
                  </tr>
                ))
              })}
            </tbody>
          </table>
        )}
      </div>

      {notTravelling.length > 0 && (
        <details className="ad-details ad-noprint" style={{ marginTop: 16 }}>
          <summary>Not travelling: {notTravelling.length} cancelled or lapsed booking{notTravelling.length > 1 ? 's' : ''}</summary>
          <div className="card ad-scroll"><table className="ad-tbl"><tbody>
            {notTravelling.map((b) => (
              <tr key={b.id}><td><Link href={`/admin/bookings/${b.code}`} className="ad-code">{b.code}</Link></td><td>{b.name} · {b.travellers} traveller{b.travellers > 1 ? 's' : ''}</td><td><StatusPill b={b} /></td><td className="num">{money(b.amount_paid)} paid</td></tr>
            ))}
          </tbody></table></div>
        </details>
      )}

      <div className="card pane ad-noprint" style={{ marginTop: 22 }}>
        <h2 className="ad-h2" style={{ fontSize: 17 }}>Edit this departure</h2>
        <p className="ad-sub">Changing the price only affects new bookings. Seats cannot go below the {s.confirmedSeats + s.heldSeats} already taken.</p>
        <DepartureForm dep={d} back={here} withCab />
        {bookings.length === 0 && (
          <form action={deleteDeparture} style={{ marginTop: 14 }}>
            <input type="hidden" name="id" value={d.id} /><input type="hidden" name="trip_id" value={d.trip_id} /><input type="hidden" name="back" value={here} />
            <ConfirmButton className="btn b-danger sm" message="Delete this departure? This cannot be undone.">Delete departure</ConfirmButton>
          </form>
        )}
      </div>
    </>
  )
}
