import Image from 'next/image'
import Link from 'next/link'
import { Art } from '@/components/Art'
import { Hero } from '@/components/Hero'
import { Mosaic, type MosaicItem } from '@/components/Gallery'
import { JsonLd } from '@/components/JsonLd'
import { TripCard } from '@/components/TripCard'
import { BUSINESS, SITE_URL } from '@/lib/config'
import { getDestinations, getTrips } from '@/lib/data'
import { addDays, isoDate, todayISO } from '@/lib/format'

export const revalidate = 60

const FAQ = [
  { q: 'Where does Lavigo Travel Co. run trips from?', a: `Lavigo is a travel company based in Ranchi, Jharkhand (${BUSINESS.address}). All group trips start and end in Ranchi.` },
  { q: 'Which destinations does Lavigo cover?', a: 'Nepal (Pokhara and Kathmandu), Darjeeling, Sikkim, Netarhat, Puri and Goa, as fixed-date group trips or custom private trips.' },
  { q: 'How do I book a group trip?', a: 'Pick a departure on the trip page and hold your seats online. Lavigo then confirms with you on WhatsApp, where you pay a 25% advance. The balance is paid before you travel.' },
  { q: 'How long are seats held before I pay?', a: 'Seats are held for 24 hours after you submit the booking form. If the advance is not paid in that time, the seats are released for other travellers.' },
  { q: 'Can I plan a trip on my own dates?', a: 'Yes. Use the trip planner to choose places, nights, stay type, travel mode and activities. You see a day-by-day plan and a price estimate, then get the final quote on WhatsApp.' },
]

export default async function Home() {
  const [dests, trips] = await Promise.all([getDestinations(), getTrips()])
  const withDeps = trips.filter((t) => t.departures.length)
  const tripSlugByDest: Record<string, string> = {}
  for (const t of trips) if (t.destination && !tripSlugByDest[t.destination.slug]) tripSlugByDest[t.destination.slug] = t.slug
  const defaultDate = isoDate(addDays(todayISO(), 21))

  const g = (slug: string, i: number): MosaicItem | null => {
    const d = dests.find((x) => x.slug === slug)
    return d && d.gallery[i] ? { label: d.name, list: d.gallery, index: i } : null
  }
  const mosaic = [g('nepal', 0), g('sikkim', 0), g('darjeeling', 0), g('nepal', 1), g('sikkim', 1), g('darjeeling', 1), g('goa', 0)].filter(Boolean) as MosaicItem[]

  return (
    <div className="home-page">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', url: SITE_URL, name: BUSINESS.name }} />
      <h1 className="skip">Lavigo Travel Co.: group and custom trips from Ranchi</h1>
      <Hero destinations={dests.map((d) => ({ slug: d.slug, name: d.name }))} tripSlugByDest={tripSlugByDest} defaultDate={defaultDate} />

      {withDeps.length > 0 && (
        <section style={{ paddingTop: 20 }}><div className="wrap">
          <div className="sec-head"><div><div className="eyebrow">Fixed dates · small groups</div><h2>Upcoming group departures</h2></div><Link className="btn b-ghost" href="/trips">See all trips</Link></div>
          <div className="grid3">{withDeps.slice(0, 3).map((t) => <TripCard key={t.id} trip={t} />)}</div>
        </div></section>
      )}

      {mosaic.length > 0 && (
        <section style={{ paddingTop: 8 }}><div className="wrap">
          <div className="sec-head"><div><div className="eyebrow">Nepal · Sikkim · Darjeeling · Goa</div><h2>Places we take you</h2></div><Link className="btn b-ghost" href="/plan">Plan a trip here</Link></div>
          <Mosaic items={mosaic} />
        </div></section>
      )}

      <section style={{ paddingTop: 8 }}><div className="wrap">
        <div className="sec-head"><div><div className="eyebrow">Your dates, your pace</div><h2>Or build your own trip</h2></div></div>
        <div className="grid4">{dests.slice(0, 4).map((d) => (
          <Link key={d.slug} className="dest" href={`/plan?dest=${d.slug}`}>
            {d.hero_image ? <Image src={d.hero_image} alt="" fill sizes="(max-width:900px) 50vw, 25vw" style={{ objectFit: 'cover' }} /> : <Art theme={d.theme} h={150} variant={1} id={d.slug} />}
            <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(20,14,45,.6))' }} />
            <b>{d.name}</b><small>{d.area}</small>
          </Link>))}
        </div>
      </div></section>

      <section style={{ paddingTop: 8 }}><div className="wrap">
        <h2 style={{ marginBottom: 18 }}>Booking takes three steps</h2>
        <div className="steps3">
          <div className="card step3"><div className="n">1</div><h3>Choose</h3><p className="muted">Pick a group departure, or plan your own trip with places, stay and activities.</p></div>
          <div className="card step3"><div className="n">2</div><h3>See every rupee</h3><p className="muted">The day-by-day plan and the full price with GST are on the page before you commit.</p></div>
          <div className="card step3"><div className="n">3</div><h3>Hold seats, confirm on WhatsApp</h3><p className="muted">Your seats are held for 24 hours. Pay the 25% advance on WhatsApp to confirm.</p></div>
        </div>
      </div></section>

      <section style={{ paddingTop: 8 }}><div className="wrap"><div className="band">
        <div><h2>Travel with a team from Ranchi</h2><p style={{ marginTop: 8 }}>Lavigo trips leave from Ranchi with a trip leader on every group departure. Follow our recent trips on Instagram before you book.</p></div>
        <ul className="ticks"><li>Hold seats online, pay the 25% advance on WhatsApp</li><li>Balance is due before you travel</li><li>Clear price with GST shown up front</li><li>One number for every question: {BUSINESS.phoneDisplay}</li></ul>
      </div></div></section>

      <section style={{ paddingTop: 8 }}><div className="wrap" style={{ maxWidth: 820 }}>
        <h2 style={{ marginBottom: 14 }}>Common questions</h2>
        {FAQ.map((f) => <details className="faq" key={f.q}><summary>{f.q}</summary><div className="a">{f.a}</div></details>)}
      </div></section>
    </div>
  )
}
