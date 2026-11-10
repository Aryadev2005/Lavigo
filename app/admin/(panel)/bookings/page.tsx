import Link from 'next/link'
import { ClickRow } from '@/components/admin/ClickRow'
import { Icon } from '@/components/Icons'
import { Flash, Head, PayPill, StatusPill, dShort, money, rel, waTo } from '@/components/admin/ui'
import { countGenders, listBookings, listDepartures, travellersOf, type BookingFilter } from '@/lib/admin-data'

export const metadata = { title: 'Bookings' }

const TABS: [string, string][] = [['active', 'Active'], ['held', 'On hold'], ['confirmed', 'Confirmed'], ['expired', 'Lapsed'], ['cancelled', 'Cancelled'], ['all', 'All']]

export default async function Bookings({ searchParams }: { searchParams: Promise<BookingFilter & { ok?: string; err?: string }> }) {
  const sp = await searchParams
  const f: BookingFilter = { status: sp.status || 'active', q: sp.q, departure: sp.departure, pay: sp.pay, source: sp.source }
  const [rows, deps] = await Promise.all([listBookings(f), listDepartures('all')])
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...f, ...patch })) if (v) p.set(k, v)
    return p.toString()
  }
  const g = countGenders(rows)
  const seats = rows.reduce((s, b) => s + b.travellers, 0)
  const paid = rows.reduce((s, b) => s + b.amount_paid, 0)
  const due = rows.filter((b) => b.status === 'confirmed').reduce((s, b) => s + Math.max(0, b.amount_total - b.amount_paid), 0)
  const selDep = deps.find((d) => d.id === f.departure)

  return (
    <>
      <Head title="Bookings" sub="Every reservation from the website and the ones you add yourself. Click a row to open it.">
        <a href={`/admin/export/bookings?${qs({})}`} className="btn b-ghost"><Icon name="download" size={16} />Download CSV</a>
        <Link href="/admin/bookings/new" className="btn b-main"><Icon name="plus" size={16} />New booking</Link>
      </Head>
      <Flash ok={sp.ok} err={sp.err} />

      <div className="ad-filters">
        <nav className="ad-tabs" aria-label="Status">
          {TABS.map(([k, l]) => <Link key={k} href={`/admin/bookings?${qs({ status: k })}`} className={f.status === k ? 'on' : undefined}>{l}</Link>)}
        </nav>
      </div>
      <form className="ad-filters" action="/admin/bookings">
        <input type="hidden" name="status" value={f.status} />
        <div className="ad-search"><Icon name="search" size={16} /><input className="inp" name="q" defaultValue={f.q} placeholder="Search name, phone, code or email" aria-label="Search bookings" /></div>
        <select className="inp" name="departure" defaultValue={f.departure ?? ''} style={{ width: 'auto', minWidth: 230 }} aria-label="Departure">
          <option value="">All departures</option>
          {deps.map((d) => <option key={d.id} value={d.id}>{dShort(d.depart_date)} · {d.trip.title}</option>)}
        </select>
        <select className="inp" name="pay" defaultValue={f.pay ?? ''} style={{ width: 'auto' }} aria-label="Payment">
          <option value="">Any payment</option><option value="unpaid">Unpaid</option><option value="partial">Part paid</option><option value="paid">Paid in full</option><option value="refunded">Refunded</option>
        </select>
        <select className="inp" name="source" defaultValue={f.source ?? ''} style={{ width: 'auto' }} aria-label="Made by">
          <option value="">Website + office</option><option value="website">Website only</option><option value="admin">Added by you</option>
        </select>
        <button className="btn b-main">Filter</button>
        {(f.q || f.departure || f.pay || f.source) && <Link href={`/admin/bookings?status=${f.status}`} className="btn b-ghost">Clear</Link>}
      </form>

      <p className="ad-sub">
        <b>{rows.length}</b> booking{rows.length === 1 ? '' : 's'} · <b>{seats}</b> traveller{seats === 1 ? '' : 's'} ({g.male} male, {g.female} female{g.unknown ? `, ${g.unknown} not given` : ''}) · {money(paid)} received{due ? ` · ${money(due)} balance due` : ''}
        {selDep && <> · <Link href={`/admin/departures/${selDep.id}`} style={{ color: 'var(--ink3)', fontWeight: 600 }}>Open manifest for {dShort(selDep.depart_date)} →</Link></>}
      </p>

      <div className="card ad-scroll">
        {rows.length === 0 ? (
          <div className="ad-empty"><b>No bookings match</b>Try another tab or clear the filters.</div>
        ) : (
          <table className="ad-tbl">
            <thead><tr><th>Booking</th><th>Lead traveller</th><th>Trip</th><th>Travellers</th><th className="num">Total</th><th className="num">Paid</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((b) => {
                const t = travellersOf(b)
                const live = b.status === 'held' && b.hold_expires_at && new Date(b.hold_expires_at).getTime() > Date.now()
                return (
                  <ClickRow key={b.id} href={`/admin/bookings/${b.code}`}>
                    <td><Link href={`/admin/bookings/${b.code}`} className="ad-code">{b.code}</Link><small>{rel(b.created_at)}{b.source === 'admin' ? ' · by you' : ''}</small></td>
                    <td><b>{b.name}</b><small><a href={`tel:+91${b.phone}`}>{b.phone}</a> · <a href={waTo(b.phone)} target="_blank" rel="noopener" style={{ color: 'var(--ok)', fontWeight: 600 }}>WhatsApp</a></small></td>
                    <td>{b.departure.trip.title}<small>{dShort(b.departure.depart_date)}{b.departure.start_city ? ` · from ${b.departure.start_city}` : ''}</small></td>
                    <td>
                      <b>{b.travellers}</b>{' '}
                      {t.map((x, i) => <span key={i} className={'gx ' + (x.gender ?? 'unknown')} title={`${x.name}${x.gender ? ` (${x.gender})` : ''}`} style={{ marginRight: 2 }}>{x.gender === 'male' ? 'M' : x.gender === 'female' ? 'F' : '?'}</span>)}
                      <small>{b.ticket_by === 'self' ? 'Own tickets' : b.from_city ? `Tickets from ${b.from_city}` : b.passengers?.length ? 'Lavigo books tickets' : ''}</small>
                    </td>
                    <td className="num">{money(b.amount_total)}</td>
                    <td className="num">{money(b.amount_paid)}{b.status === 'confirmed' && b.amount_paid < b.amount_total ? <small>{money(b.amount_total - b.amount_paid)} due</small> : null}</td>
                    <td><StatusPill b={b} />{b.status === 'confirmed' && <div style={{ marginTop: 4 }}><PayPill b={b} /></div>}{live && <small>lapses {rel(b.hold_expires_at!)}</small>}</td>
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
