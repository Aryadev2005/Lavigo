import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Art } from '@/components/Art'
import { BookingForm } from '@/components/BookingForm'
import { GalleryStrip } from '@/components/Gallery'
import { JsonLd } from '@/components/JsonLd'
import { BUSINESS, SITE_URL } from '@/lib/config'
import { getDestinations, getTripBySlug, getTrips } from '@/lib/data'
import { addDays, daysTo, fmtDate, inr } from '@/lib/format'
import { waLink } from '@/lib/whatsapp'

export const revalidate = 60

export async function generateStaticParams() {
  try { return (await getTrips()).map((t) => ({ slug: t.slug })) } catch (e) { console.error('generateStaticParams: skipping prebuild of trips', e); return [] } // pages then render on first visit
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const trip = await getTripBySlug((await params).slug)
  if (!trip) return {}
  const dep = trip.departures[0]
  const desc = `${trip.title}: ${trip.nights}N/${trip.nights + 1}D group trip from Ranchi. ${trip.route}.` + (dep ? ` From ${inr(dep.price)} per person incl. GST, next departure ${fmtDate(dep.depart_date, { day: 'numeric', month: 'long', year: 'numeric' })}.` : '')
  return {
    title: trip.title,
    description: desc,
    alternates: { canonical: `/trips/${trip.slug}` },
    openGraph: { title: trip.title, description: desc, url: `/trips/${trip.slug}`, images: trip.image ? [{ url: trip.image }] : undefined },
  }
}

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [trip, dests] = await Promise.all([getTripBySlug(slug), getDestinations()])
  if (!trip) notFound()
  const dest = dests.find((d) => d.slug === trip.destination?.slug)
  const dep = trip.departures[0]
  const url = `${SITE_URL}/trips/${trip.slug}`
  const wa = waLink(`Hi Lavigo, I have a question about the ${trip.title}.`)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      '@id': `${url}#trip`,
      name: trip.title,
      description: trip.summary,
      url,
      image: trip.image ? `${SITE_URL}${trip.image}` : undefined,
      touristType: 'Group travellers',
      provider: { '@id': `${SITE_URL}/#agency` },
      itinerary: { '@type': 'ItemList', itemListElement: trip.itinerary.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: d.title, description: d.text })) },
      offers: trip.departures.map((d) => ({
        '@type': 'Offer',
        url,
        price: d.price,
        priceCurrency: 'INR',
        availability: d.seats_left > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
        description: `Departure ${d.depart_date} from Ranchi`,
      })),
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: trip.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Group trips', item: `${SITE_URL}/trips` },
        { '@type': 'ListItem', position: 3, name: trip.title, item: url },
      ],
    },
  ]

  return (
    <div className={dep ? 'has-bar' : undefined}>
      {jsonLd.map((d, i) => <JsonLd key={i} data={d} />)}
      <div className="thero">
        {trip.image
          ? <Image src={trip.image} alt={trip.title} fill priority sizes="100vw" style={{ objectFit: 'cover' }} />
          : <Art theme={trip.destination?.theme ?? ['#3A0CA3', '#4CC9F0', '#F1FAEE']} h={300} id={trip.slug} />}
        <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(20,14,45,.35),rgba(20,14,45,.88))' }} />
        <div className="wrap">
          {dep && <span className="chip" style={{ alignSelf: 'flex-start' }}>{daysTo(dep.depart_date)} days to go · {fmtDate(dep.depart_date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
          <h1 style={{ fontSize: 'clamp(34px,6vw,56px)', marginTop: 10 }}>{trip.title}</h1>
          <p style={{ color: '#E5DFF8', marginTop: 6 }}>{trip.route}</p>
        </div>
      </div>

      <div className="wrap"><div className="tgrid">
        <div>
          <div className="card" style={{ padding: 16, display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <span className="chip lav">{trip.nights}N / {trip.nights + 1}D</span>
            <span className="chip lav">Leaves from Ranchi</span>
            <span className="chip lav">Trip leader</span>
            {dep && <span className={'chip ' + (dep.seats_left === 0 ? 'sold' : dep.seats_left < 10 ? 'warn' : 'ok')}>{dep.seats_left === 0 ? 'Sold out' : `${dep.seats_left} of ${dep.seats_total} seats left`}</span>}
          </div>

          <p style={{ marginBottom: 18, color: '#3E3760' }}>{trip.summary}</p>
          {dest && dest.gallery.length > 0 && <GalleryStrip images={dest.gallery} label={dest.name} />}

          <h2 style={{ marginBottom: 12 }}>Day by day</h2>
          {trip.itinerary.map((x, i) => (
            <details className="day" key={i} open={i === 0}>
              <summary>
                <div className="dn">DAY<span>{i + 1}</span></div>
                <div><b>{x.title}</b>{dep && <div className="muted" style={{ fontSize: 13 }}>{fmtDate(addDays(dep.depart_date, i), { weekday: 'short', day: 'numeric', month: 'short' })}</div>}</div>
              </summary>
              <div className="bd">{x.text}</div>
            </details>
          ))}

          <div className="two" style={{ marginTop: 18 }}>
            <div className="card" style={{ padding: 16 }}><h3 style={{ marginBottom: 6 }}>Included</h3><ul className="ticks">{trip.inclusions.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div className="card" style={{ padding: 16 }}><h3 style={{ marginBottom: 6 }}>Not included</h3><ul style={{ paddingLeft: 18, color: '#3E3760' }}>{trip.exclusions.map((x) => <li key={x} style={{ padding: '3px 0' }}>{x}</li>)}</ul></div>
          </div>

          {trip.faqs.length > 0 && (
            <>
              <h2 style={{ margin: '26px 0 12px' }}>Questions about this trip</h2>
              {trip.faqs.map((f) => <details className="faq" key={f.q}><summary>{f.q}</summary><div className="a">{f.a}</div></details>)}
            </>
          )}
          <p className="muted" style={{ marginTop: 18, fontSize: 14 }}>Prefer your own dates? <Link href="/plan" style={{ textDecoration: 'underline' }}>Plan a custom trip</Link> or call {BUSINESS.phoneDisplay}.</p>
        </div>

        <aside id="book"><div className="card sumcard">
          <div className="sumhead"><small>{dep ? 'From, per person' : 'Group trip'}</small><div className="price">{dep ? inr(dep.price) : 'Dates soon'}</div><small>incl. GST · leaves from Ranchi</small></div>
          <BookingForm
            whatsappHref={wa}
            departures={trip.departures.map((d) => ({ id: d.id, date: d.depart_date, price: d.price, seatsLeft: d.seats_left }))}
          />
        </div></aside>
      </div></div>

      {dep && (
        <div className="mbar">
          <div><b>{inr(dep.price)}</b><small>per person · {dep.seats_left === 0 ? 'sold out' : `${dep.seats_left} seats left`}</small></div>
          <a className="btn b-main" href="#book">Reserve seats</a>
        </div>
      )}
    </div>
  )
}
