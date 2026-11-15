import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Art } from '@/components/Art'
import { DestinationCard } from '@/components/DestinationCard'
import { GalleryGrid } from '@/components/Gallery'
import { Icon, WhatsAppGlyph } from '@/components/Icons'
import { JsonLd } from '@/components/JsonLd'
import { TripCard } from '@/components/TripCard'
import { ADVANCE, HOLD_HOURS, SITE_URL } from '@/lib/config'
import { getDestinationSummaries, getDestinationSummary } from '@/lib/destinations'
import { fmtDate, inr } from '@/lib/format'
import { absUrl, pageMeta, snippet } from '@/lib/seo'
import { waLink } from '@/lib/whatsapp'
import '../destinations.css'

export const revalidate = 60

export async function generateStaticParams() {
  try { return (await getDestinationSummaries()).map((s) => ({ slug: s.d.slug })) } catch { return [] }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await getDestinationSummary((await params).slug)
  if (!r) return { title: 'Destination not found' }
  const { d, guide, fromPrice } = r.one
  const price = fromPrice ? ` Group trips from ${inr(fromPrice)}.` : ''
  return pageMeta({
    // guide titles already carry the search phrase; a short brand keeps them under ~65 characters
    title: guide ? `${guide.title} | Lavigo` : `${d.name} trips: ${d.area}`,
    absoluteTitle: Boolean(guide),
    description: guide?.description ?? snippet(`${d.name} trips with Lavigo Travel Co.: ${d.blurb}${price} Private trips from any city in India on your dates.`),
    path: `/destinations/${d.slug}`,
    image: r.one.cover,
    imageAlt: `${d.name}, ${d.area}`,
  })
}

const pct = Math.round(ADVANCE * 100)

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const r = await getDestinationSummary((await params).slug)
  if (!r) notFound()
  const { one, others } = r
  const { d, guide, trips, cover, nights, fromPrice, next, startCities, hasGroupTrip } = one
  const url = `${SITE_URL}/destinations/${d.slug}`
  const intro = guide?.intro ?? [d.blurb].filter(Boolean)
  const planHref = `/plan?dest=${d.slug}`
  const wa = waLink(`Hi Lavigo, I'm interested in a ${d.name} trip.`)
  const gallery = (d.gallery ?? []).filter((g) => g?.src)
  const activities = (d.activities ?? []).filter((a) => a?.n)
  const datedTrips = trips.filter((t) => t.departures.length)

  // FAQs: the guide's own, plus two answered from live data (price and how booking works)
  const faqs = [
    ...(fromPrice && next
      ? [{ q: `How much does a ${d.name} trip cost?`, a: `Group trips to ${d.name} start from ${inr(fromPrice)} per person including 5% GST. The next departure is on ${fmtDate(next.date, { day: 'numeric', month: 'long', year: 'numeric' })} from ${next.city}. Private trips are priced on your dates, hotels and group size; build a plan on the website for an estimate.` }]
      : [{ q: `How much does a ${d.name} trip cost?`, a: `${d.name} is planned as a private trip, so the price depends on your dates, hotels, car and group size. Build a plan on the website for an instant estimate, then get the final quote on WhatsApp.` }]),
    ...(guide?.faqs ?? []),
    { q: `How do I book a ${d.name} trip with Lavigo?`, a: hasGroupTrip
      ? `Pick a departure on the trip page and hold your seats online; they are kept for ${HOLD_HOURS} hours. Pay a ${pct}% advance on WhatsApp to confirm, and the balance before you travel. For a private trip, build a plan or send an enquiry and we reply on WhatsApp.`
      : `Build a plan on the website or send an enquiry. The owner replies on WhatsApp with a day-by-day plan and a quote. A ${pct}% advance confirms the booking.` },
  ]

  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'TouristDestination', '@id': `${url}#destination`,
      name: d.name, url, description: intro.join(' ') || d.blurb,
      ...(cover || gallery.length ? { image: [...(cover ? [cover] : []), ...gallery.map((g) => g.src).filter((s) => s !== cover)].slice(0, 8).map(absUrl) } : {}),
      touristType: ['Group travellers', 'Families', 'Couples'],
      ...(guide ? { containsPlace: guide.places.map((p) => ({ '@type': 'TouristAttraction', name: p.name, description: p.about })) } : {}),
      ...(datedTrips.length ? { subjectOf: datedTrips.map((t) => ({ '@type': 'TouristTrip', name: t.title, url: `${SITE_URL}/trips/${t.slug}`, provider: { '@id': `${SITE_URL}/#agency` } })) } : {}),
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Destinations', item: `${SITE_URL}/destinations` },
        { '@type': 'ListItem', position: 3, name: d.name, item: url },
      ],
    },
  ]

  const facts = [
    { icon: 'calendar' as const, k: 'Best time', v: guide?.bestTimeShort ?? 'All year' },
    { icon: 'clock' as const, k: 'Ideal length', v: `${nights} nights` },
    { icon: 'rupee' as const, k: hasGroupTrip ? 'Group trips from' : 'Trip type', v: fromPrice ? `${inr(fromPrice)} pp` : 'Private, your dates' },
    { icon: 'pin' as const, k: 'Starts from', v: startCities.length ? startCities.join(', ') : 'Any city in India' },
  ]

  return (
    <article className="ds">
      {jsonLd.map((x, i) => <JsonLd key={i} data={x} />)}

      <header className="bp-hero ds-hero">
        {cover ? <Image src={cover} alt={`${d.name}, ${d.area}`} fill priority sizes="100vw" style={{ objectFit: 'cover' }} /> : <Art theme={d.theme} h={720} variant={1} id={'h' + d.slug} />}
        <span className="bp-shade" />
        <div className="m-wrap bp-hero-in">
          <nav className="ds-crumbs-l" aria-label="Breadcrumb"><Link href="/">Home</Link> › <Link href="/destinations">Destinations</Link> › <span>{d.name}</span></nav>
          <p className="bl-meta"><span>{d.area}</span>{hasGroupTrip && <span>Group departures</span>}<span>Private trips</span></p>
          <h1>{guide?.h1 ?? `${d.name} trips`}</h1>
          <p className="bp-ex">{d.blurb}</p>
          <div className="ds-hero-acts">
            {hasGroupTrip
              ? <a href="#departures" className="lv-pill">See departures <span aria-hidden="true"><Icon name="arrow" size={16} /></span></a>
              : <Link href={planHref} className="lv-pill">Plan this trip <span aria-hidden="true"><Icon name="arrow" size={16} /></span></Link>}
            <a href={wa} target="_blank" rel="noopener" className="lv-pill lv-pill-ghost">Ask on WhatsApp <span aria-hidden="true"><WhatsAppGlyph size={16} /></span></a>
          </div>
        </div>
      </header>

      <div className="m-wrap">
        <dl className="ds-facts">
          {facts.map((f) => (
            <div key={f.k}><Icon name={f.icon} size={20} /><dt>{f.k}</dt><dd>{f.v}</dd></div>
          ))}
        </dl>
      </div>

      <div className="m-wrap ds-grid">
        <div className="ds-main">
          {hasGroupTrip && (
            <section id="departures" className="ds-sec">
              <h2>Group departures to {d.name}</h2>
              <p className="ds-lead">Fixed dates with a Lavigo trip leader. Prices are per person and include GST; seats are held online for {HOLD_HOURS} hours.</p>
              <div className="ds-trips">{datedTrips.map((t) => <TripCard key={t.id} trip={t} />)}</div>
            </section>
          )}

          <section className="ds-sec">
            <h2>About {d.name}</h2>
            {intro.map((p, i) => <p key={i}>{p}</p>)}
          </section>

          {guide && guide.places.length > 0 && (
            <section className="ds-sec">
              <h2>Places to see in {d.name}</h2>
              <ol className="ds-places">
                {guide.places.map((p) => <li key={p.name}><b>{p.name}</b><span>{p.about}</span></li>)}
              </ol>
            </section>
          )}

          {gallery.length > 0 && (
            <section className="ds-sec">
              <h2>{d.name} in photos</h2>
              <GalleryGrid images={gallery} label={d.name} />
            </section>
          )}

          {activities.length > 0 && (
            <section className="ds-sec">
              <h2>Things to do</h2>
              <p className="ds-lead">Add any of these to a private trip in the planner; group itineraries list what is included.</p>
              <ul className="ds-acts">
                {activities.map((a) => <li key={a.id ?? a.n}><Icon name="check" size={16} /><span>{a.n}{a.where && <small>{a.where}</small>}</span></li>)}
              </ul>
            </section>
          )}

          {guide && (
            <section className="ds-sec">
              <h2>Best time to visit {d.name}</h2>
              <div className="ds-seasons">
                {guide.bestTime.map((s) => <div key={s.label}><b>{s.label}</b><small>{s.months}</small><p>{s.text}</p></div>)}
              </div>
            </section>
          )}

          {guide && (
            <section className="ds-sec">
              <h2>How to get to {d.name}</h2>
              {guide.gettingThere.map((p, i) => <p key={i}>{p}</p>)}
            </section>
          )}

          {guide && guide.goodToKnow.length > 0 && (
            <section className="ds-sec">
              <h2>Good to know</h2>
              <div className="ds-know">
                {guide.goodToKnow.map((g) => <div key={g.title}><b>{g.title}</b><p>{g.text}</p></div>)}
              </div>
            </section>
          )}

          <section className="ds-sec" id="faqs">
            <h2>{d.name} trip FAQs</h2>
            {faqs.map((f) => <details className="m-faq m-faq-flat" key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </section>
        </div>

        <aside className="ds-side">
          <div className="ds-card">
            <p className="lv-eyebrow">{hasGroupTrip ? 'Next departure' : 'Private trip'}</p>
            {next ? (
              <>
                <b className="ds-card-t">{fmtDate(next.date, { weekday: 'short', day: 'numeric', month: 'long' })}</b>
                <span className="ds-card-s">from {next.city} · {next.trip.nights}N/{next.trip.nights + 1}D</span>
                <div className="ds-card-p"><span>{inr(next.price)}</span><small>per person · incl. GST</small></div>
                <Link href={`/trips/${next.trip.slug}`} className="lv-pill">Book seats <span aria-hidden="true"><Icon name="arrow" size={16} /></span></Link>
              </>
            ) : (
              <>
                <b className="ds-card-t">{d.name} on your dates</b>
                <span className="ds-card-s">From any city in India, with your choice of hotels and car.</span>
              </>
            )}
            <Link href={planHref} className={next ? 'ds-card-link' : 'lv-pill'}>{next ? 'Or plan a private trip →' : <>Plan &amp; get an estimate <span aria-hidden="true"><Icon name="arrow" size={16} /></span></>}</Link>
            <a href={wa} target="_blank" rel="noopener" className="ds-card-wa"><WhatsAppGlyph size={16} /> Ask a question</a>
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="m-sec ds-more">
          <div className="m-wrap">
            <div className="m-sec-h"><div><h2>More destinations</h2></div><Link href="/destinations" className="m-more">All destinations <Icon name="arrow" size={18} /></Link></div>
            <div className="lv-dests">
              {others.slice(0, 3).map((s) => <DestinationCard key={s.d.slug} d={s.d} cover={s.cover} nights={s.nights} fromPrice={s.fromPrice} hasGroupTrip={s.hasGroupTrip} />)}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
