import Image from 'next/image'
import { BUSINESS, SITE_URL } from '@/lib/config'
import { TIER_LABEL, stars } from '@/lib/stays'
import type { Car, Hotel } from '@/lib/types'
import { PrintBar } from './PrintBar'

export type ItinDay = { n: number; date?: string; title: string; text: string }

type Props = {
  kind: string
  title: string
  route?: string
  facts: [string, string][]
  days: ItinDay[]
  included: string[]
  excluded: string[]
  hotels: Hotel[]
  cars: Car[]
  hotelNote?: string
  notes: string[]
  backHref: string
  fileName: string
}

/** A clean A4 itinerary. "Download PDF" opens the browser's save-as-PDF dialog. */
export function ItineraryDoc(p: Props) {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  return (
    <div className="it-wrap">
      <PrintBar backHref={p.backHref} fileName={p.fileName} />
      <article className="it">
        <header className="it-head">
          <div className="it-logo"><Image src="/img/logo.webp" alt="Lavigo Travel Co." width={288} height={105} priority style={{ height: 30, width: 'auto' }} /></div>
          <div className="it-contact">
            <b>{BUSINESS.name}</b>
            <span>{BUSINESS.phoneDisplay} · WhatsApp</span>
            <span>{SITE_URL.replace(/^https?:\/\//, '')} · @lavigo.in</span>
          </div>
        </header>

        <section className="it-title">
          <small>{p.kind}</small>
          <h1>{p.title}</h1>
          {p.route && <p>{p.route}</p>}
        </section>

        <dl className="it-facts">
          {p.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>

        <section className="it-sec">
          <h2>Day by day</h2>
          <ol className="it-days">
            {p.days.map((d) => (
              <li key={d.n}>
                <span className="it-n">Day {d.n}</span>
                <div>
                  {d.date && <small>{d.date}</small>}
                  <h3>{d.title}</h3>
                  {d.text && <p>{d.text}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {(p.included.length > 0 || p.excluded.length > 0) && (
          <section className="it-sec it-inc">
            <div><h2>Included</h2><ul>{p.included.map((x) => <li key={x} className="yes">{x}</li>)}</ul></div>
            <div><h2>Not included</h2><ul>{p.excluded.map((x) => <li key={x} className="no">{x}</li>)}</ul></div>
          </section>
        )}

        {(p.hotels.length > 0 || p.cars.length > 0) && (
          <section className="it-sec">
            <h2>Hotels and cars</h2>
            {p.hotelNote && <p className="it-muted">{p.hotelNote}</p>}
            {p.hotels.length > 0 && (
              <table className="it-tbl">
                <thead><tr><th>Hotel</th><th>Town</th><th>Type</th></tr></thead>
                <tbody>{p.hotels.map((h) => <tr key={h.place + h.name}><td><b>{h.name}</b>{h.note && <small>{h.note}</small>}</td><td>{h.place}</td><td>{TIER_LABEL[h.tier]} {stars(h.stars)}</td></tr>)}</tbody>
              </table>
            )}
            {p.cars.length > 0 && (
              <table className="it-tbl">
                <thead><tr><th>Car</th><th>Type</th><th>Seats</th></tr></thead>
                <tbody>{p.cars.map((c) => <tr key={c.name}><td><b>{c.name}</b>{c.note && <small>{c.note}</small>}</td><td>{c.kind}</td><td>{c.seats}</td></tr>)}</tbody>
              </table>
            )}
          </section>
        )}

        <section className="it-sec">
          <h2>Good to know</h2>
          <ul className="it-notes">{p.notes.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>

        <footer className="it-foot">
          <span>{BUSINESS.address}</span>
          <span>Prepared on {today}. Plans can change with weather and road conditions.</span>
        </footer>
      </article>
    </div>
  )
}
