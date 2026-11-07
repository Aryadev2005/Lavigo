'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Art } from './Art'
import { Icon } from './Icons'
import { fmtDate, inr } from '@/lib/format'

export type Row = {
  key: string
  slug: string
  title: string
  route: string
  nights: number
  image: string | null
  theme: [string, string, string]
  dest: string
  destName: string
  date: string | null
  price: number | null
  seatsLeft: number
  seatsTotal: number
  chips: string[]
  highlights: string[]
}

type Sort = 'soon' | 'low' | 'high'
const DUR = [
  { id: 'weekend', label: 'Weekend (2–3 days)', test: (n: number) => n <= 2 },
  { id: 'mid', label: '4–5 days', test: (n: number) => n >= 3 && n <= 4 },
  { id: 'long', label: '6+ days', test: (n: number) => n >= 5 },
]
const BUD = [
  { id: 'b1', label: 'Under ₹10,000', test: (p: number) => p < 10000 },
  { id: 'b2', label: '₹10,000 – ₹15,000', test: (p: number) => p >= 10000 && p <= 15000 },
  { id: 'b3', label: 'Above ₹15,000', test: (p: number) => p > 15000 },
]

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

export function TripsBrowser({ rows }: { rows: Row[] }) {
  const [dests, setDests] = useState<string[]>([])
  const [durs, setDurs] = useState<string[]>([])
  const [buds, setBuds] = useState<string[]>([])
  const [sort, setSort] = useState<Sort>('soon')

  // honour ?dest=nepal and ?d=weekend links from the home page
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const d = q.get('dest')
    if (d && rows.some((r) => r.dest === d)) setDests([d])
    if (q.get('d') === 'weekend') setDurs(['weekend'])
  }, [rows])

  const destOpts = useMemo(() => {
    const m = new Map<string, { name: string; n: number }>()
    for (const r of rows) m.set(r.dest, { name: r.destName, n: (m.get(r.dest)?.n ?? 0) + 1 })
    return [...m.entries()].map(([id, v]) => ({ id, ...v }))
  }, [rows])

  const list = rows
    .filter((r) => !dests.length || dests.includes(r.dest))
    .filter((r) => !durs.length || DUR.some((d) => durs.includes(d.id) && d.test(r.nights)))
    .filter((r) => !buds.length || (r.price !== null && BUD.some((b) => buds.includes(b.id) && b.test(r.price!))))
    .sort((a, b) => {
      if (sort === 'low') return (a.price ?? 1e9) - (b.price ?? 1e9)
      if (sort === 'high') return (b.price ?? -1) - (a.price ?? -1)
      return (a.date ?? '9999').localeCompare(b.date ?? '9999')
    })

  const groups: { label: string; items: Row[] }[] = []
  if (sort === 'soon') {
    for (const r of list) {
      const label = r.date ? fmtDate(r.date, { month: 'long', year: 'numeric' }).toUpperCase() : 'DATES COMING SOON'
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.items.push(r)
      else groups.push({ label, items: [r] })
    }
  } else if (list.length) groups.push({ label: sort === 'low' ? 'PRICE: LOW TO HIGH' : 'PRICE: HIGH TO LOW', items: list })

  const count = list.filter((r) => r.date).length
  const clear = () => { setDests([]); setDurs([]); setBuds([]) }

  return (
    <div className="m-list">
      <aside className="m-card m-filters" aria-label="Filters">
        <div className="m-filters-h"><b>Filters</b><button type="button" onClick={clear}>Clear all</button></div>
        <fieldset>
          <legend>Destination</legend>
          {destOpts.map((d) => (
            <label key={d.id}><input type="checkbox" checked={dests.includes(d.id)} onChange={() => setDests(toggle(dests, d.id))} /><span>{d.name}</span><small>{d.n}</small></label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Duration</legend>
          {DUR.map((d) => <label key={d.id}><input type="checkbox" checked={durs.includes(d.id)} onChange={() => setDurs(toggle(durs, d.id))} /><span>{d.label}</span></label>)}
        </fieldset>
        <fieldset>
          <legend>Budget per person</legend>
          {BUD.map((b) => <label key={b.id}><input type="checkbox" checked={buds.includes(b.id)} onChange={() => setBuds(toggle(buds, b.id))} /><span>{b.label}</span></label>)}
        </fieldset>
        <div className="m-filters-note">
          <b>Don&apos;t see your dates?</b>
          <span>Plan a private trip and get a quote on WhatsApp.</span>
          <Link href="/plan">Open trip planner <Icon name="arrow" size={16} /></Link>
        </div>
      </aside>

      <div className="m-results">
        <div className="m-results-h">
          <h1>{count} group departure{count === 1 ? '' : 's'} from Ranchi</h1>
          <div className="m-sort" role="group" aria-label="Sort by">
            {([['soon', 'Departing soonest'], ['low', 'Price: low to high'], ['high', 'Price: high to low']] as const).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={sort === k} className={sort === k ? 'on' : undefined} onClick={() => setSort(k)}>{l}</button>
            ))}
          </div>
        </div>

        {groups.map((g) => (
          <div key={g.label} className="m-month">
            <div className="m-month-h"><b>{g.label}</b><span /></div>
            {g.items.map((r) => (
              <article key={r.key} className="m-card m-row">
                <Link href={`/trips/${r.slug}`} className="m-row-pic" tabIndex={-1} aria-hidden="true">
                  {r.image
                    ? <Image src={r.image} alt="" fill sizes="(max-width:900px) 100vw, 260px" style={{ objectFit: 'cover' }} />
                    : <Art theme={r.theme} h={200} id={'r' + r.key} />}
                  <span className="m-tag m-tag-i">{r.nights}N / {r.nights + 1}D</span>
                </Link>
                <div className="m-row-body">
                  <Link href={`/trips/${r.slug}`} className="m-row-t">{r.title}</Link>
                  <div className="m-sm m-muted2">{r.route}</div>
                  <div className="m-chips m-chips-ic">
                    {r.date && <span><Icon name="calendar" size={16} />{fmtDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>}
                    {r.chips.map((c) => <span key={c}><Icon name={/hotel|stay/i.test(c) ? 'hotel' : /meal|breakfast|dinner|lunch/i.test(c) ? 'meal' : 'bus'} size={16} />{c}</span>)}
                  </div>
                  {r.highlights.length > 0 && <ul>{r.highlights.map((h) => <li key={h}>{h}</li>)}</ul>}
                </div>
                <div className="m-row-pr">
                  <div>
                    {r.date && <span className={'m-seat' + (r.seatsLeft === 0 ? ' sold' : '')}>{r.seatsLeft === 0 ? 'Sold out' : r.seatsLeft < r.seatsTotal ? `${r.seatsLeft} seats left` : `${r.seatsTotal}-seat group`}</span>}
                    {r.price !== null ? (
                      <>
                        <div className="m-price m-price-lg">{inr(r.price)}</div>
                        <div className="m-xs m-muted">per person · incl. 5% GST</div>
                        <div className="m-xs" style={{ marginTop: 6 }}>Advance <b>{inr(Math.round(r.price * 0.25))}</b></div>
                      </>
                    ) : <div className="m-sm m-muted" style={{ marginTop: 8 }}>Next dates soon</div>}
                  </div>
                  <Link href={`/trips/${r.slug}`} className="m-btn-sun m-block">View details</Link>
                </div>
              </article>
            ))}
          </div>
        ))}

        {!groups.length && (
          <div className="m-card m-empty">No trips match these filters. <button type="button" onClick={clear}>Clear filters</button> or <Link href="/plan">plan a private trip</Link>.</div>
        )}
      </div>
    </div>
  )
}
