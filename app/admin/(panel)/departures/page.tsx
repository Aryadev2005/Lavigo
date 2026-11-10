import Link from 'next/link'
import { DepartureForm } from '@/components/admin/DepartureForm'
import { ClickRow } from '@/components/admin/ClickRow'
import { Icon } from '@/components/Icons'
import { Flash, GenderBar, Head, SeatMeter, dDay, money } from '@/components/admin/ui'
import { listDepartures, listTripsAdmin } from '@/lib/admin-data'
import { daysTo, todayISO } from '@/lib/format'

export const metadata = { title: 'Departures' }

export default async function Departures({ searchParams }: { searchParams: Promise<{ when?: string; new?: string; ok?: string; err?: string }> }) {
  const sp = await searchParams
  const when = sp.when === 'past' ? 'past' : sp.when === 'all' ? 'all' : 'upcoming'
  const [deps, trips] = await Promise.all([listDepartures(when), listTripsAdmin()])
  const totals = deps.reduce((a, d) => ({ seats: a.seats + d.seats_total, conf: a.conf + d.stats.confirmedSeats, held: a.held + d.stats.heldSeats, m: a.m + d.stats.genders.male, f: a.f + d.stats.genders.female, u: a.u + d.stats.genders.unknown, rec: a.rec + d.stats.received, due: a.due + d.stats.due }), { seats: 0, conf: 0, held: 0, m: 0, f: 0, u: 0, rec: 0, due: 0 })

  return (
    <>
      <Head title="Departures" sub="Every dated batch across all trips. Open one to see the full traveller list with genders, payments and tickets." />
      <Flash ok={sp.ok} err={sp.err} />

      <details className="card pane ad-details" open={sp.new === '1'} style={{ marginBottom: 18 }}>
        <summary><Icon name="plus" size={16} />Add a departure</summary>
        <DepartureForm trips={trips.map((t) => ({ id: t.id, title: t.title }))} back="/admin/departures" minDate={todayISO()} />
      </details>

      <div className="ad-filters">
        <nav className="ad-tabs" aria-label="When">
          {([['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']] as const).map(([k, l]) => <Link key={k} href={`/admin/departures?when=${k}`} className={when === k ? 'on' : undefined}>{l}</Link>)}
        </nav>
        <span className="ad-sub" style={{ margin: '0 0 0 8px' }}>{deps.length} departures · {totals.conf} confirmed and {totals.held} on hold of {totals.seats} seats · {totals.m} male, {totals.f} female · {money(totals.rec)} received{totals.due ? `, ${money(totals.due)} due` : ''}</span>
      </div>

      <div className="card ad-scroll">
        {deps.length === 0 ? <div className="ad-empty"><b>No departures here</b>Add one above, or from a trip&apos;s page.</div> : (
          <table className="ad-tbl">
            <thead><tr><th>Date</th><th>Trip</th><th style={{ minWidth: 200 }}>Seats</th><th>Travellers</th><th className="num">Received</th><th className="num">Balance due</th><th>Booking</th></tr></thead>
            <tbody>
              {deps.map((d) => {
                const days = daysTo(d.depart_date)
                return (
                  <ClickRow key={d.id} href={`/admin/departures/${d.id}`}>
                    <td><Link href={`/admin/departures/${d.id}`}><b>{dDay(d.depart_date)}</b></Link><small>{days > 0 ? `in ${days} days` : days === 0 ? 'today' : `${-days} days ago`}</small></td>
                    <td>{d.trip.title}<small>From {d.start_city} · {money(d.price)} pp{!d.trip.published ? ' · trip hidden' : ''}</small></td>
                    <td><SeatMeter total={d.seats_total} confirmed={d.stats.confirmedSeats} held={d.stats.heldSeats} /></td>
                    <td><GenderBar g={d.stats.genders} /></td>
                    <td className="num">{money(d.stats.received)}</td>
                    <td className="num">{d.stats.due ? money(d.stats.due) : <span className="muted">—</span>}</td>
                    <td><span className={'pill ' + (d.status === 'closed' ? 'closed' : d.stats.seatsLeft === 0 ? 'confirmed' : 'open')}>{d.status === 'closed' ? 'Closed' : d.stats.seatsLeft === 0 ? 'Full' : 'Open'}</span></td>
                  </ClickRow>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
