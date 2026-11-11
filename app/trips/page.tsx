import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/JsonLd'
import { tripChips } from '@/components/TripCard'
import { TripsBrowser, type Row } from '@/components/TripsBrowser'
import { SITE_URL } from '@/lib/config'
import { getTrips } from '@/lib/data'
import { fmtDate } from '@/lib/format'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Group trips across India',
  description: 'Fixed-date group trips to Nepal, Darjeeling, Sikkim and Netarhat from cities across India. Trip leader on every departure, hotels and cars listed, prices with GST, seats held online.',
  alternates: { canonical: '/trips' },
}

const FALLBACK: [string, string, string] = ['#3A0CA3', '#4CC9F0', '#F1FAEE']

export default async function Trips() {
  const trips = await getTrips()
  const rows: Row[] = trips.flatMap((t): Row[] => {
    const c = tripChips(t.inclusions)
    const base = {
      slug: t.slug,
      title: t.title,
      route: t.route,
      nights: t.nights,
      image: t.image,
      theme: (t.destination?.theme ?? FALLBACK) as [string, string, string],
      dest: t.destination?.slug ?? t.slug,
      destName: t.destination?.name ?? t.title,
      chips: [c.stay ? 'Hotels' : null, c.travel, c.meals].filter((x): x is string => !!x),
      highlights: t.itinerary.slice(1, 3).map((d) => d.highlights?.[0] || d.text || '').filter(Boolean),
      weekend: t.kind === 'weekend',
    }
    if (!t.departures.length) return [{ ...base, key: t.id, date: null, price: null, seatsLeft: 0, seatsTotal: 0, startCity: null }]
    return t.departures.map((d) => ({ ...base, key: d.id, date: d.depart_date, price: d.price, seatsLeft: d.seats_left, seatsTotal: d.seats_total, startCity: d.start_city }))
  })
  const dates = rows.map((r) => r.date).filter((d): d is string => !!d).sort()
  const cities = [...new Set(rows.map((r) => r.startCity).filter((c): c is string => !!c))]
  const span = dates.length ? `${fmtDate(dates[0], { month: 'short', year: 'numeric' })}${dates.length > 1 ? ` – ${fmtDate(dates[dates.length - 1], { month: 'short', year: 'numeric' })}` : ''}` : 'Dates coming soon'

  return (
    <div className="m-page">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: trips.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/trips/${t.slug}`, name: t.title })) }} />
      <div className="m-strip">
        <div className="m-wrap m-strip-g">
          <div><small>STARTING CITIES</small><b>{cities.length ? cities.join(', ') : 'To be announced'}</b></div>
          <div><small>TO</small><b>All destinations</b></div>
          <div><small>DEPARTURES</small><b>{span}</b></div>
          <div><small>FROM ANOTHER CITY?</small><b>We book your tickets</b></div>
          <Link href="/plan" className="m-btn-sun">PLAN CUSTOM</Link>
        </div>
      </div>
      <div className="m-wrap" style={{ padding: '18px 24px 64px' }}>
        <nav className="m-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> › Group trips</nav>
        <TripsBrowser rows={rows} />
      </div>
    </div>
  )
}
