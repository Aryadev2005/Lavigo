import Link from 'next/link'
import { listDestinationsAdmin } from '@/lib/admin-data'
import { inr } from '@/lib/format'

export default async function Destinations({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  const sp = await searchParams
  const dests = await listDestinationsAdmin()
  return (
    <>
      <div className="between" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <div><h1>Planner rates</h1><p className="muted">Prices and photos behind the &quot;Plan my trip&quot; page, per destination.</p></div>
        <Link className="btn b-main" href="/admin/destinations/new">+ New destination</Link>
      </div>
      {sp.err && <div className="errbox" role="alert">{sp.err}</div>}
      {sp.ok && <div className="okbox" role="status">{sp.ok}</div>}
      <div className="card tbl-scroll"><table>
        <thead><tr><th>Destination</th><th>Room / night (budget · comfort · premium)</th><th>Travel from Ranchi (train · cab · flight)</th><th>Shown</th><th></th></tr></thead>
        <tbody>{dests.map((d) => (
          <tr key={d.id}>
            <td><b>{d.name}</b><div className="muted" style={{ fontSize: 12 }}>{d.area}</div></td>
            <td>{inr(d.rate_budget)} · {inr(d.rate_comfort)} · {inr(d.rate_premium)}</td>
            <td>{inr(d.travel_train)} · {inr(d.travel_cab)} · {inr(d.travel_flight)}</td>
            <td><span className={'pill ' + (d.published ? 'open' : 'closed')}>{d.published ? 'Yes' : 'Hidden'}</span></td>
            <td><Link className="btn b-ghost sm" href={`/admin/destinations/${d.id}`}>Edit</Link></td>
          </tr>))}
        </tbody>
      </table></div>
    </>
  )
}
