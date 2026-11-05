import Link from 'next/link'
import { listTripsAdmin } from '@/lib/admin-data'
import { fmtDate, inr, todayISO } from '@/lib/format'

export default async function TripsAdmin({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  const sp = await searchParams
  const trips = await listTripsAdmin()
  const today = todayISO()
  return (
    <>
      <div className="between" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <div><h1>Trips &amp; dates</h1><p className="muted">Add a trip once, then add a departure (date, price, seats) for each batch.</p></div>
        <Link className="btn b-main" href="/admin/trips/new">+ New trip</Link>
      </div>
      {sp.err && <div className="errbox" role="alert">{sp.err}</div>}
      {sp.ok && <div className="okbox" role="status">{sp.ok}</div>}
      <div className="card tbl-scroll"><table>
        <thead><tr><th>Trip</th><th>Shown on site</th><th>Upcoming departures</th><th></th></tr></thead>
        <tbody>
          {trips.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 24, textAlign: 'center' }}>No trips yet.</td></tr>}
          {trips.map((t) => {
            const up = t.departures.filter((d) => d.depart_date >= today)
            return (
              <tr key={t.id}>
                <td><b>{t.title}</b><div className="muted" style={{ fontSize: 12 }}>{t.destination?.name ?? 'No destination'} · {t.nights}N</div></td>
                <td><span className={'pill ' + (t.published ? 'open' : 'closed')}>{t.published ? 'Yes' : 'Hidden'}</span></td>
                <td>{up.length === 0 ? <span className="muted">None. Add a date.</span> : up.map((d) => (
                  <div key={d.id} style={{ fontSize: 13.5 }}>{fmtDate(d.depart_date, { day: 'numeric', month: 'short', year: 'numeric' })} · {inr(d.price)} · <b>{d.seats_left}</b> of {d.seats_total} left{d.status === 'closed' && ' · closed'}</div>
                ))}</td>
                <td><Link className="btn b-ghost sm" href={`/admin/trips/${t.id}`}>Edit</Link></td>
              </tr>
            )
          })}
        </tbody>
      </table></div>
    </>
  )
}
