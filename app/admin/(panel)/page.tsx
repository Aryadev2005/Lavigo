import Link from 'next/link'
import { Icon } from '@/components/Icons'
import { Flash, GenderBar, Head, SeatMeter, Stat, StatusPill, dDay, dShort, money, rel } from '@/components/admin/ui'
import { listDepartures, overview, travellersOf } from '@/lib/admin-data'
import { daysTo } from '@/lib/format'

export const metadata = { title: 'Overview' }

export default async function Overview({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [sp, o, deps] = await Promise.all([searchParams, overview(), listDepartures('upcoming')])
  const next = deps.slice(0, 6)
  const hour = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }))
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const attention = o.expiringSoon.length + o.balanceSoon.length

  return (
    <>
      <Head title={greet} sub={o.newToday ? `${o.newToday} new booking${o.newToday > 1 ? 's' : ''} today. ${attention ? `${attention} thing${attention > 1 ? 's' : ''} need${attention > 1 ? '' : 's'} your attention.` : 'Nothing urgent.'}` : attention ? `${attention} thing${attention > 1 ? 's' : ''} need${attention > 1 ? '' : 's'} your attention.` : 'Everything is up to date.'}>
        <Link href="/admin/bookings/new" className="btn b-main"><Icon name="plus" size={16} />New booking</Link>
        <Link href="/admin/departures?new=1" className="btn b-ghost"><Icon name="calendar" size={16} />Add a departure</Link>
      </Head>
      <Flash ok={sp.ok} err={sp.err} />

      <div className="ad-stats">
        <Stat icon="clock" label="Waiting for payment" value={o.holds} note={o.holds ? `${o.heldSeats} seats held · ${money(o.heldValue)} in advances` : 'No seats on hold'} hot={o.holds > 0} />
        <Stat icon="group" label="Travellers confirmed" value={o.upcomingTravellers} note="on upcoming departures" />
        <Stat icon="wallet" label="Money received" value={money(o.received)} note={`${money(o.receivedThisMonth)} this month`} />
        <Stat icon="receipt" label="Balance to collect" value={money(o.due)} note="from upcoming trips" />
      </div>

      <div className="ad-2col">
        <div className="card">
          <div className="ad-cardh"><h2>Needs attention</h2><Link href="/admin/bookings?status=held">All holds →</Link></div>
          {attention === 0 ? (
            <div className="ad-empty"><b>All clear</b>No holds about to lapse and no balances due in the next 14 days.</div>
          ) : (
            <ul className="ad-list">
              {o.expiringSoon.map((b) => (
                <li key={b.id}><Link href={`/admin/bookings/${b.code}`}>
                  <span className="ad-ic warn"><Icon name="clock" size={18} /></span>
                  <span className="x"><b>{b.name}</b> · <span className="ad-code">{b.code}</span><small>Hold lapses {rel(b.hold_expires_at!)} · {b.departure.trip.title}, {dShort(b.departure.depart_date)}</small></span>
                  <span className="r"><b>{money(b.amount_advance)}</b><small>advance due</small></span>
                </Link></li>
              ))}
              {o.balanceSoon.map((b) => (
                <li key={b.id}><Link href={`/admin/bookings/${b.code}`}>
                  <span className="ad-ic bad"><Icon name="wallet" size={18} /></span>
                  <span className="x"><b>{b.name}</b> · <span className="ad-code">{b.code}</span><small>Travels {daysTo(b.departure.depart_date) <= 0 ? 'today' : `in ${daysTo(b.departure.depart_date)} days`} · {b.departure.trip.title}</small></span>
                  <span className="r"><b>{money(b.amount_total - b.amount_paid)}</b><small>balance due</small></span>
                </Link></li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="ad-cardh"><h2>Latest bookings</h2><Link href="/admin/bookings?status=all">All bookings →</Link></div>
          {o.recent.length === 0 ? <div className="ad-empty"><b>No bookings yet</b>They appear here as soon as someone reserves on the website.</div> : (
            <ul className="ad-list">
              {o.recent.map((b) => {
                const t = travellersOf(b)
                return (
                  <li key={b.id}><Link href={`/admin/bookings/${b.code}`}>
                    <span className="ad-ic"><Icon name="ticket" size={18} /></span>
                    <span className="x"><b>{b.name}</b>{t.length > 1 ? <span className="muted"> +{t.length - 1}</span> : null} · <span className="ad-code">{b.code}</span><small>{b.departure.trip.title} · {dShort(b.departure.depart_date)} · {rel(b.created_at)}</small></span>
                    <span className="r"><StatusPill b={b} /><small style={{ marginTop: 3 }}>{money(b.amount_total)}</small></span>
                  </Link></li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="ad-sec">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div><h2 className="ad-h2">Next departures</h2><p className="ad-sub" style={{ margin: 0 }}>How full each batch is, and who is travelling.</p></div>
          <Link href="/admin/departures" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink3)' }}>All departures →</Link>
        </div>
        {next.length === 0 ? (
          <div className="card ad-empty"><b>No upcoming departures</b><Link href="/admin/departures?new=1" className="btn b-main" style={{ marginTop: 12 }}>Add a departure</Link></div>
        ) : (
          <div className="ad-deps">
            {next.map((d) => (
              <Link key={d.id} href={`/admin/departures/${d.id}`} className="card ad-dep">
                <div className="ad-dep-top">
                  <div className="ad-dep-date">{dDay(d.depart_date).split(',')[0]} {new Date(d.depart_date + 'T12:00:00+05:30').getDate()}<small>{dShort(d.depart_date)} · {daysTo(d.depart_date) <= 0 ? 'today' : `in ${daysTo(d.depart_date)} days`}</small></div>
                  <span className={'pill ' + (d.status === 'closed' ? 'closed' : d.stats.seatsLeft === 0 ? 'confirmed' : 'open')}>{d.status === 'closed' ? 'Closed' : d.stats.seatsLeft === 0 ? 'Full' : 'Open'}</span>
                </div>
                <h3>{d.trip.title}</h3>
                <p>From {d.start_city} · {d.trip.nights}N · {money(d.price)} per person</p>
                <SeatMeter total={d.seats_total} confirmed={d.stats.confirmedSeats} held={d.stats.heldSeats} />
                <div className="ad-dep-foot">
                  <GenderBar g={d.stats.genders} />
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{money(d.stats.received)}<span className="muted" style={{ fontWeight: 400 }}> in</span></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
