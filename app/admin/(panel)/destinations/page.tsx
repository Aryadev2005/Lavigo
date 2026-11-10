import Image from 'next/image'
import Link from 'next/link'
import { ClickRow } from '@/components/admin/ClickRow'
import { Icon } from '@/components/Icons'
import { Flash, Head, money } from '@/components/admin/ui'
import { listDestinationsAdmin, listTripsAdmin } from '@/lib/admin-data'
import { withStays } from '@/lib/stays'

export const metadata = { title: 'Destinations' }

export default async function Destinations({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  const [sp, dests, trips] = await Promise.all([searchParams, listDestinationsAdmin(), listTripsAdmin()])
  return (
    <>
      <Head title="Destinations" sub="Places, photos, hotels, cars and the private rates behind the trip planner. Customers only ever see totals.">
        <Link className="btn b-main" href="/admin/destinations/new"><Icon name="plus" size={16} />New destination</Link>
      </Head>
      <Flash ok={sp.ok} err={sp.err} />
      <div className="card ad-scroll">
        <table className="ad-tbl">
          <thead><tr><th>Destination</th><th>Trips</th><th>Photos</th><th>Hotels · cars</th><th>Room per night</th><th>On website</th></tr></thead>
          <tbody>{dests.map((raw) => {
            const d = withStays(raw)
            const own = (raw.hotels?.length ?? 0) > 0
            const n = trips.filter((t) => t.destination_id === d.id).length
            return (
              <ClickRow key={d.id} href={`/admin/destinations/${d.id}`}>
                <td>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 64, height: 46, borderRadius: 9, overflow: 'hidden', background: 'var(--lav2)', position: 'relative', flex: 'none' }}>
                      {d.hero_image && <Image src={d.hero_image} alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />}
                    </div>
                    <div><Link href={`/admin/destinations/${d.id}`}><b>{d.name}</b></Link><small>{d.area}</small></div>
                  </div>
                </td>
                <td>{n || <span className="muted">—</span>}</td>
                <td>{d.gallery.length}</td>
                <td>{d.hotels.length} · {d.cars.length}{!own && d.hotels.length > 0 ? <small style={{ color: 'var(--warn)' }}>starter list — add real hotels</small> : null}</td>
                <td>{money(d.rate_budget)} · {money(d.rate_comfort)} · {money(d.rate_premium)}<small>budget · comfort · premium</small></td>
                <td><span className={'pill ' + (d.published ? 'live' : 'hidden')}>{d.published ? 'Live' : 'Hidden'}</span></td>
              </ClickRow>
            )
          })}</tbody>
        </table>
      </div>
    </>
  )
}
