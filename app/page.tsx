import Image from 'next/image'
import Link from 'next/link'
import { Art } from '@/components/Art'
import { Icon, type IconName } from '@/components/Icons'
import { HomeSearch } from '@/components/HomeSearch'
import { JsonLd } from '@/components/JsonLd'
import { Moments } from '@/components/Moments'
import { TripCard } from '@/components/TripCard'
import { BUSINESS, SITE_URL } from '@/lib/config'
import { getDestinations, getTrips } from '@/lib/data'
import { addDays, inr, isoDate, todayISO } from '@/lib/format'
import { ABOUT_IMAGE, HERO_IMAGE, HERO_VIDEO, PLAN_IMAGE, REELS } from '@/lib/media'
import { waLink } from '@/lib/whatsapp'

export const revalidate = 60

const FAQ = [
  { q: 'Where does Lavigo Travel Co. run trips from?', a: `Lavigo is a travel company based in Ranchi, Jharkhand (${BUSINESS.address}). All group trips start and end in Ranchi.` },
  { q: 'Which destinations does Lavigo cover?', a: 'Nepal (Pokhara and Kathmandu), Darjeeling, Sikkim, Netarhat, Puri and Goa, as fixed-date group trips or custom private trips.' },
  { q: 'How do I book a group trip?', a: 'Pick a departure on the trip page and hold your seats online. Lavigo then confirms with you on WhatsApp, where you pay a 25% advance. The balance is paid before you travel.' },
  { q: 'How long are seats held before I pay?', a: 'Seats are held for 24 hours after you submit the booking form. If the advance is not paid in that time, the seats are released for other travellers.' },
  { q: 'Can I plan a trip on my own dates?', a: 'Yes. Use the trip planner to choose places, nights, stay type, travel mode and activities. You see a day-by-day plan and a price estimate, then get the final quote on WhatsApp.' },
]

const TRUST: { t: string; s: string; c: 'lav' | 'sun'; i: IconName }[] = [
  { t: 'Seats held 24 hours', s: 'Reserve now, pay later', c: 'lav', i: 'clock' },
  { t: 'Only 25% advance', s: 'Balance before you travel', c: 'sun', i: 'wallet' },
  { t: 'GST included', s: 'The price you see is final', c: 'lav', i: 'receipt' },
  { t: 'Trip leader on board', s: 'Every group departure', c: 'sun', i: 'leader' },
]

export default async function Home() {
  const [dests, trips] = await Promise.all([getDestinations(), getTrips()])
  const withDeps = trips.filter((t) => t.departures.length)
  const minDate = isoDate(addDays(todayISO(), 7))

  const departures = withDeps
    .flatMap((t) => t.departures.filter((d) => d.seats_left > 0).map((d) => ({ tripSlug: t.slug, title: t.destination?.name ?? t.title, dest: t.destination?.slug ?? '', date: d.depart_date, nights: t.nights })))
    .sort((a, b) => a.date.localeCompare(b.date))

  const fromPrice = (slug: string) => {
    const ps = trips.filter((t) => t.destination?.slug === slug).flatMap((t) => t.departures.map((d) => d.price))
    return ps.length ? Math.min(...ps) : null
  }
  const tripFor = (slug: string) => withDeps.find((t) => t.destination?.slug === slug) ?? trips.find((t) => t.destination?.slug === slug)

  return (
    <div className="m-page">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', url: SITE_URL, name: BUSINESS.name }} />

      <section className="m-hero">
        {HERO_VIDEO
          ? <video className="m-hero-media" src={HERO_VIDEO} poster={HERO_IMAGE} autoPlay muted loop playsInline aria-hidden="true" />
          : <Image className="m-hero-media" src={HERO_IMAGE} alt="" fill priority sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center 45%' }} />}
        <span className="m-hero-shade" />
        <div className="m-wrap m-hero-in">
          <div className="m-hero-top">
            <div>
              <p className="m-kicker">Fixed-date group trips · Custom private trips</p>
              <h1 className="m-hero-h">Trips from Ranchi,<br />planned day by day.</h1>
            </div>
            <Link href="/#moments" className="m-reel-btn">
              <span aria-hidden="true"><Icon name="play" size={16} /></span>
              Watch trip moments
            </Link>
          </div>
          <HomeSearch destinations={dests.map((d) => ({ slug: d.slug, name: d.name, area: d.area }))} departures={departures} minDate={minDate} />
        </div>
      </section>

      <section className="m-sec" style={{ paddingTop: 64 }}>
        <div className="m-wrap">
          <div className="m-trust">
            {TRUST.map((x) => (
              <div key={x.t}><span className={'m-ic ' + x.c}><Icon name={x.i} size={26} /></span><div><b>{x.t}</b><span>{x.s}</span></div></div>
            ))}
          </div>
        </div>
      </section>

      {withDeps.length > 0 && (
        <section className="m-sec">
          <div className="m-wrap">
            <div className="m-sec-h">
              <div><h2>Upcoming group departures</h2><p>Fixed dates, small groups, everything from Ranchi.</p></div>
              <Link href="/trips" className="m-more">View all trips <Icon name="arrow" size={18} /></Link>
            </div>
            <div className="m-g4">{withDeps.slice(0, 4).map((t) => <TripCard key={t.id} trip={t} />)}</div>
          </div>
        </section>
      )}

      <section className="m-sec" id="destinations">
        <div className="m-wrap">
          <div className="m-sec-h"><div><h2>Handpicked destinations</h2><p>Join a group departure or plan a private trip on your own dates.</p></div></div>
          <div className="m-dests">
            {dests.map((d, i) => {
              const t = tripFor(d.slug)
              const p = fromPrice(d.slug)
              return (
                <Link key={d.slug} href={t ? `/trips/${t.slug}` : `/plan?dest=${d.slug}`} className={'m-dest' + (i === 0 ? ' big' : '')}>
                  {d.hero_image
                    ? <Image src={d.hero_image} alt={`${d.name}: ${d.area}`} fill sizes={i === 0 ? '(max-width:600px) 100vw, 50vw' : '(max-width:600px) 100vw, 25vw'} style={{ objectFit: 'cover' }} />
                    : <Art theme={d.theme} h={220} variant={1} id={'d' + d.slug} />}
                  <span className="m-dest-t"><b>{d.name}</b><span>{d.area}{p ? ` · from ${inr(p)}` : t ? '' : ' · private trips'}</span></span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="m-sec" id="moments">
        <div className="m-wrap">
          <div className="m-sec-h">
            <div><h2>Trip moments</h2><p>Short videos from our recent group trips.</p></div>
            <a href={BUSINESS.instagram} target="_blank" rel="noopener" className="m-more">More on Instagram @lavigo.in <Icon name="arrow" size={18} /></a>
          </div>
          <Moments reels={REELS} instagram={BUSINESS.instagram} />
        </div>
      </section>

      <section className="m-sec" id="plan">
        <div className="m-wrap">
          <div className="m-band">
            <div className="m-band-txt">
              <p className="m-kicker">Custom trip planner</p>
              <h2>Your dates, your group, your pace.</h2>
              <p>Pick places, nights, stay type and activities. See a day-by-day plan and a price estimate instantly, then get the final quote on WhatsApp.</p>
              <div className="m-band-cta">
                <Link href="/plan" className="m-btn-sun">Plan my trip</Link>
                <a href={waLink('Hi Lavigo, I want to plan a private trip.')} target="_blank" rel="noopener" className="m-btn-ghost">Talk to us on WhatsApp</a>
              </div>
            </div>
            <div className="m-band-pic"><Image src={PLAN_IMAGE} alt="Rocky coast in Goa" fill sizes="(max-width:900px) 100vw, 45vw" style={{ objectFit: 'cover' }} /></div>
          </div>
        </div>
      </section>

      <section className="m-sec">
        <div className="m-wrap">
          <div className="m-sec-h"><div><h2>Booking takes three steps</h2></div></div>
          <div className="m-g3">
            <div className="m-card m-step"><span>01</span><h3>Choose a departure</h3><p>Pick a fixed-date group trip, or plan a private one with your own places and activities.</p></div>
            <div className="m-card m-step"><span>02</span><h3>Hold your seats</h3><p>Seats are held for 24 hours with a booking code. Nothing to pay online.</p></div>
            <div className="m-card m-step"><span>03</span><h3>Confirm on WhatsApp</h3><p>Pay the 25% advance on WhatsApp and we confirm. The balance is due before you travel.</p></div>
          </div>
        </div>
      </section>

      <section className="m-sec" id="about" style={{ paddingBottom: 64 }}>
        <div className="m-wrap m-about">
          <div className="m-card m-about-c">
            <div className="m-about-pic"><Image src={ABOUT_IMAGE} alt="Monastery below the Himalaya, Nepal" fill sizes="(max-width:900px) 100vw, 400px" style={{ objectFit: 'cover' }} /></div>
            <div style={{ padding: 24 }}>
              <h2 className="m-h3">A travel team from Ranchi</h2>
              <p className="m-muted" style={{ marginTop: 8 }}>{BUSINESS.name} runs every group trip from our office in Chutia, Samlong. A Lavigo trip leader travels with each group from the first day to the last.</p>
              <p className="m-sm" style={{ marginTop: 12 }}>{BUSINESS.address}</p>
            </div>
          </div>
          <div className="m-about-faq">
            <h2 className="m-h3" style={{ marginBottom: 14 }}>Common questions</h2>
            {FAQ.map((f, i) => <details className="m-faq" key={f.q} open={i === 0}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </div>
        </div>
      </section>
    </div>
  )
}
