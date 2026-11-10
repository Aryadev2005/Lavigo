import Image from 'next/image'
import Link from 'next/link'
import { ClickRow } from '@/components/admin/ClickRow'
import { Icon } from '@/components/Icons'
import { Flash, GenderBar, Head, dShort, money } from '@/components/admin/ui'
import { listTripsAdmin } from '@/lib/admin-data'
import { todayISO } from '@/lib/format'

export const metadata = { title: 'Trips' }

export default async function Trips({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [sp, trips] = await Promise.all([searchParams, listTripsAdmin()])
  const today = todayISO()
  return (
    <>
      <Head title="Trips" sub="Each group trip has one page on the website. Add it once, then add a departure for every batch.">
        <Link href="/admin/trips/new" className="btn b-main"><Icon name="plus" size={16} />New trip</Link>
      </Head>
      <Flash ok={sp.ok} err={sp.err} />
      <div className="card ad-scroll">
        {trips.length === 0 ? <div className="ad-empty"><b>No trips yet</b><Link href="/admin/trips/new" className="btn b-main" style={{ marginTop: 12 }}>Create the first trip</Link></div> : (
          <table className="ad-tbl">
            <thead><tr><th>Trip</th><th>On website</th><th>Next departures</th><th>Booked (upcoming)</th><th></th></tr></thead>
            <tbody>
              {trips.map((t) => {
                const up = t.departures.filter((d) => d.depart_date >= today)
                const g = up.reduce((a, d) => ({ male: a.male + d.stats.genders.male, female: a.female + d.stats.genders.female, unknown: a.unknown + d.stats.genders.unknown }), { male: 0, female: 0, unknown: 0 })
                const pics = 1 + (t.gallery?.length ?? 0)
                return (
                  <ClickRow key={t.id} href={`/admin/trips/${t.id}`}>
                    <td>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 64, height: 46, borderRadius: 9, overflow: 'hidden', background: 'var(--lav2)', position: 'relative', flex: 'none' }}>
                          {t.image && <Image src={t.image} alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />}
                        </div>
                        <div><Link href={`/admin/trips/${t.id}`}><b>{t.title}</b></Link><small>{t.destination?.name ?? 'No destination'} · {t.nights}N/{t.nights + 1}D · {t.itinerary.length} days planned · {t.image ? pics : 0} photo{pics === 1 ? '' : 's'}</small></div>
                      </div>
                    </td>
                    <td><span className={'pill ' + (t.published ? 'live' : 'hidden')}>{t.published ? 'Live' : 'Hidden'}</span></td>
                    <td>{up.length === 0 ? <span className="muted">No dates — add one</span> : up.slice(0, 3).map((d) => (
                      <div key={d.id} style={{ fontSize: 13 }}><Link href={`/admin/departures/${d.id}`} style={{ color: 'var(--ink3)', fontWeight: 600 }}>{dShort(d.depart_date)}</Link> · {money(d.price)} · <b>{d.stats.seatsLeft}</b> of {d.seats_total} left{d.status === 'closed' ? ' · closed' : ''}</div>
                    ))}{up.length > 3 && <small>+{up.length - 3} more</small>}</td>
                    <td>{up.length ? <GenderBar g={g} /> : <span className="muted">—</span>}</td>
                    <td><Link href={`/trips/${t.slug}`} target="_blank" rel="noopener" className="btn b-ghost sm" aria-label={`View ${t.title} on the website`}><Icon name="external" size={14} />View</Link></td>
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
