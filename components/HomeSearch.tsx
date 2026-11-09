'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { fmtDate } from '@/lib/format'
import { CityInput } from './CityInput'

type Dest = { slug: string; name: string; area: string }
type Dep = { tripSlug: string; title: string; dest: string; date: string; nights: number; startCity: string }
type Tab = 'group' | 'custom' | 'weekend'

export function HomeSearch({ destinations, departures, minDate }: { destinations: Dest[]; departures: Dep[]; minDate: string }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('group')
  const groupDests = destinations.filter((d) => departures.some((x) => x.dest === d.slug))
  const [dest, setDest] = useState(groupDests[0]?.slug ?? destinations[0]?.slug ?? '')
  const [date, setDate] = useState(minDate)
  const [pax, setPax] = useState(2)
  const [from, setFrom] = useState('')

  const destList = tab === 'group' ? groupDests : destinations
  const cur = destinations.find((d) => d.slug === dest)
  const deps = departures.filter((x) => x.dest === dest)
  const [depIdx, setDepIdx] = useState(0)
  const dep = deps[Math.min(depIdx, deps.length - 1)]

  const pick = (t: Tab) => {
    setTab(t)
    setDepIdx(0)
    if (t === 'weekend' && destinations.some((d) => d.slug === 'netarhat')) setDest('netarhat')
    else if (t === 'group' && !departures.some((x) => x.dest === dest) && groupDests[0]) setDest(groupDests[0].slug)
  }

  const go = () => {
    if (tab === 'custom') router.push(`/plan?dest=${dest}&date=${date}&pax=${pax}${from.trim() ? `&from=${encodeURIComponent(from.trim())}` : ''}`)
    else if (dep) router.push(`/trips/${dep.tripSlug}`)
    else router.push(tab === 'weekend' ? '/trips?d=weekend' : `/trips?dest=${dest}`)
  }

  const showDeps = tab !== 'custom' && deps.length > 0

  return (
    <div className="m-search">
      <div className="m-search-tabs" role="tablist" aria-label="Trip type">
        {([['group', 'Group Trips'], ['custom', 'Custom Trip'], ['weekend', 'Weekend Getaways']] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : undefined} onClick={() => pick(k)}>{l}</button>
        ))}
      </div>
      <div className="m-search-meta">
        <span>{tab === 'custom' ? 'Private trip on your own dates' : 'Fixed departures with a trip leader'}</span>
        <span>Prices include GST</span>
      </div>
      <div className="m-fields">
        {tab === 'custom' ? (
          <label className="m-field">
            <span className="m-fl">From</span>
            <CityInput id="hs-from" className="m-fv m-fv-in" value={from} onChange={setFrom} placeholder="Your city" />
            <span className="m-fs">Any city in India</span>
          </label>
        ) : (
          <div className="m-field">
            <span className="m-fl">Starts from</span>
            <span className="m-fv">{showDeps && dep ? dep.startCity : 'Any city'}</span>
            <span className="m-fs">We can book your tickets</span>
          </div>
        )}
        <label className="m-field">
          <span className="m-fl">To</span>
          <select className="m-fv" value={dest} onChange={(e) => { setDest(e.target.value); setDepIdx(0) }}>
            {destList.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          </select>
          <span className="m-fs">{cur?.area}</span>
        </label>
        {showDeps ? (
          <label className="m-field">
            <span className="m-fl">Departure</span>
            <select className="m-fv" value={Math.min(depIdx, deps.length - 1)} onChange={(e) => setDepIdx(+e.target.value)}>
              {deps.map((x, i) => <option key={x.date + x.tripSlug} value={i}>{fmtDate(x.date, { day: 'numeric', month: 'short', year: '2-digit' })}</option>)}
            </select>
            <span className="m-fs">{dep ? `${fmtDate(dep.date, { weekday: 'long' })} · ${dep.nights}N / ${dep.nights + 1}D` : ''}</span>
          </label>
        ) : (
          <label className="m-field">
            <span className="m-fl">{tab === 'custom' ? 'Start date' : 'Departure'}</span>
            <input className="m-fv" type="date" value={date} min={minDate} onChange={(e) => setDate(e.target.value)} />
            <span className="m-fs">{tab === 'custom' ? 'Any date that suits you' : 'Next dates coming soon'}</span>
          </label>
        )}
        <label className="m-field">
          <span className="m-fl">Travellers</span>
          <select className="m-fv" value={pax} onChange={(e) => setPax(+e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => <option key={n} value={n}>{n} {n > 1 ? 'Adults' : 'Adult'}</option>)}
          </select>
          <span className="m-fs">Children pay 60%</span>
        </label>
      </div>
      {departures.length > 0 && (
        <div className="m-popular">
          <b>Popular:</b>
          {departures.slice(0, 4).map((x) => (
            <Link key={x.tripSlug + x.date} href={`/trips/${x.tripSlug}`}>{x.title} · {fmtDate(x.date, { day: 'numeric', month: 'short' })}</Link>
          ))}
        </div>
      )}
      <button type="button" className="m-go" onClick={go}>Search trips</button>
    </div>
  )
}
