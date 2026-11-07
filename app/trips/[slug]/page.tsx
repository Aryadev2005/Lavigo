import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Art } from '@/components/Art'
import { BookingForm } from '@/components/BookingForm'
import { GalleryGrid } from '@/components/Gallery'
import { JsonLd } from '@/components/JsonLd'
import { seatLabel, tripChips } from '@/components/TripCard'
import { ADVANCE, BUSINESS, CHILD_FACTOR, GST, HOLD_HOURS, SITE_URL } from '@/lib/config'
import { getDestinations, getTripBySlug, getTrips } from '@/lib/data'
import { addDays, fmtDate, inr } from '@/lib/format'
import type { GalleryImage } from '@/lib/types'
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
  const chips = tripChips(trip.inclusions)

  const photos: GalleryImage[] = [
    ...(trip.image ? [{ src: trip.image, caption: trip.title }] : []),
    ...(dest?.gallery ?? []).filter((g) => g.src !== trip.image),
  ]
  const dayPhoto = (i: number) => dest?.gallery[i] ?? null

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
    <div className={'m-page' + (dep ? ' has-bar' : '')}>
      {jsonLd.map((d, i) => <JsonLd key={i} data={d} />)}

      <div className="m-wrap" style={{ paddingTop: 18 }}>
        <nav className="m-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> › <Link href="/trips">Group trips</Link> › {trip.destination?.name ?? trip.title}</nav>
        <div className="m-td-head">
          <div>
            <div className="m-chips" style={{ marginBottom: 8 }}>
              <span className="m-chip-ink">{trip.nights}N / {trip.nights + 1}D</span>
              <span className="m-chip-lav">Group trip · from Ranchi</span>
              {dep && <span className={'m-seat' + (dep.seats_left === 0 ? ' sold' : '')}>{seatLabel(dep.seats_left, dep.seats_total)}</span>}
            </div>
            <h1 className="m-td-h">{trip.title}</h1>
            <p className="m-muted2" style={{ marginTop: 6 }}>{trip.route}</p>
          </div>
          <a href={wa} target="_blank" rel="noopener" className="m-btn-line">Ask about this trip</a>
        </div>
        {photos.length > 0
          ? <GalleryGrid images={photos} label={trip.title} />
          : <div className="m-gal-art"><Art theme={trip.destination?.theme ?? ['#3A0CA3', '#4CC9F0', '#F1FAEE']} h={300} id={trip.slug} /></div>}
      </div>

      <nav className="m-stabs" aria-label="Trip sections">
        <div className="m-wrap">
          <a href="#itinerary">Itinerary</a>
          <a href="#inclusions">Inclusions</a>
          <a href="#book">Dates &amp; price</a>
          <a href="#policies">Policies</a>
          {trip.faqs.length > 0 && <a href="#faqs">FAQs</a>}
        </div>
      </nav>

      <div className="m-wrap m-td">
        <div className="m-td-main">
          <div className="m-card m-pad">
            <p style={{ lineHeight: 1.6 }}>{trip.summary}</p>
            <div className="m-facts">
              <div><small>Duration</small><b>{trip.nights} nights, {trip.nights + 1} days</b></div>
              {chips.meals && <div><small>Meals</small><b>{chips.meals}</b></div>}
              {chips.travel && <div><small>Travel</small><b>{chips.travel}</b></div>}
              {dep && <div><small>Group size</small><b>{dep.seats_total} seats</b></div>}
            </div>
          </div>

          <div className="m-card m-pad" id="itinerary">
            <h2 className="m-h3">Day-by-day itinerary</h2>
            {trip.itinerary.map((x, i) => {
              const p = dayPhoto(i)
              return (
                <div className={'m-day' + (p ? ' has-pic' : '')} key={i}>
                  <span className="m-day-n">{i + 1}</span>
                  <div>
                    <small className="m-muted">Day {i + 1}{dep ? ` · ${fmtDate(addDays(dep.depart_date, i), { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}</small>
                    <b>{x.title}</b>
                    <p>{x.text}</p>
                  </div>
                  {p && <div className="m-day-pic"><Image src={p.src} alt={p.caption} fill sizes="(max-width:900px) 100vw, 200px" style={{ objectFit: 'cover' }} /></div>}
                </div>
              )
            })}
          </div>

          <div className="m-card m-pad m-inc" id="inclusions">
            <div>
              <h2 className="m-h3">Included</h2>
              <ul>{trip.inclusions.map((x) => <li key={x} className="yes">{x}</li>)}</ul>
            </div>
            <div>
              <h2 className="m-h3">Not included</h2>
              <ul>{trip.exclusions.map((x) => <li key={x} className="no">{x}</li>)}</ul>
            </div>
          </div>

          <div className="m-card m-pad" id="policies">
            <h2 className="m-h3">Booking &amp; payment</h2>
            <ul className="m-bul">
              <li>Seats are held for {HOLD_HOURS} hours after you submit the booking form.</li>
              <li>Pay a {ADVANCE * 100}% advance on WhatsApp to confirm. The balance is due before you travel.</li>
              <li>Prices include {GST * 100}% GST. Children pay {CHILD_FACTOR * 100}% of the adult price.</li>
              <li>Cancellations follow our <Link href="/refund-policy">refund policy</Link>.</li>
            </ul>
          </div>

          {trip.faqs.length > 0 && (
            <div className="m-card m-pad" id="faqs">
              <h2 className="m-h3">FAQs</h2>
              {trip.faqs.map((f) => <details className="m-faq m-faq-flat" key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </div>
          )}
          <p className="m-sm m-muted">Prefer your own dates? <Link href="/plan">Plan a custom trip</Link> or call {BUSINESS.phoneDisplay}.</p>
        </div>

        <aside id="book" className="m-td-side"><div className="m-card sumcard m-book">
          <div className="sumhead"><small>{dep ? 'Starting from' : 'Group trip'}</small><div className="price">{dep ? inr(dep.price) : 'Dates soon'} {dep && <small>per person</small>}</div><small>Includes {GST * 100}% GST · leaves from Ranchi</small></div>
          <BookingForm
            whatsappHref={wa}
            departures={trip.departures.map((d) => ({ id: d.id, date: d.depart_date, price: d.price, seatsLeft: d.seats_left }))}
          />
        </div></aside>
      </div>

      {dep && (
        <div className="mbar">
          <div><b>{inr(dep.price)}</b><small>per person · {dep.seats_left === 0 ? 'sold out' : `${dep.seats_left} seats left`}</small></div>
          <a className="m-btn-sun" href="#book">Hold seats</a>
        </div>
      )}
    </div>
  )
}
