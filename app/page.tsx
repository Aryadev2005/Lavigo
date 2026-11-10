import Image from 'next/image'
import Link from 'next/link'
import { Art } from '@/components/Art'
import { PhotoWall } from '@/components/Gallery'
import { Icon, type IconName } from '@/components/Icons'
import { HomeSearch } from '@/components/HomeSearch'
import { JsonLd } from '@/components/JsonLd'
import { Moments } from '@/components/Moments'
import { TripCard } from '@/components/TripCard'
import { BUSINESS, SITE_URL } from '@/lib/config'
import { getDestinations, getTrips } from '@/lib/data'
import { addDays, inr, isoDate, todayISO } from '@/lib/format'
import { ABOUT_IMAGE, HERO_IMAGE, HERO_VIDEO, PLAN_IMAGE, REELS } from '@/lib/media'
import { getSite } from '@/lib/site'
import { waLink } from '@/lib/whatsapp'

export const revalidate = 60


const TRUST: { t: string; s: string; c: 'lav' | 'sun'; i: IconName }[] = [
  { t: 'Seats held 24 hours', s: 'Reserve now, pay later', c: 'lav', i: 'clock' },
  { t: 'Only 25% advance', s: 'Balance before you travel', c: 'sun', i: 'wallet' },
  { t: 'From anywhere in India', s: 'We can book your tickets', c: 'lav', i: 'pin' },
  { t: 'Trip leader on board', s: 'Every group departure', c: 'sun', i: 'leader' },
]

export default async function Home() {
  const [dests, trips, site] = await Promise.all([getDestinations(), getTrips(), getSite()])
  const { home, business } = site
  const FAQ = home.faqs
  const headLines = home.headline.split('\n').map((l) => l.trim()).filter(Boolean)
  const withDeps = trips.filter((t) => t.departures.length)
  const minDate = isoDate(addDays(todayISO(), 7))

  const departures = withDeps
    .flatMap((t) => t.departures.filter((d) => d.seats_left > 0).map((d) => ({ tripSlug: t.slug, title: t.destination?.name ?? t.title, dest: t.destination?.slug ?? '', date: d.depart_date, nights: t.nights, startCity: d.start_city })))
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
              <p className="m-kicker">{home.kicker}</p>
              <h1 className="m-hero-h">{headLines.map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</h1>
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
              <div><h2>Upcoming group departures</h2><p>{home.subline}</p></div>
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
            <div><h2>Trip moments</h2><p>Short videos from our recent Nepal group trip.</p></div>
            <a href={business.instagram} target="_blank" rel="noopener" className="m-more">More on Instagram <Icon name="arrow" size={18} /></a>
          </div>
          <Moments reels={REELS} instagram={business.instagram} />
        </div>
      </section>

      {home.photos.length > 0 && (
        <section className="m-sec" id="gallery">
          <div className="m-wrap">
            <div className="m-sec-h">
              <div><h2>{home.photosTitle}</h2><p>{home.photosText}</p></div>
              <Link href="/trips" className="m-more">See upcoming trips <Icon name="arrow" size={18} /></Link>
            </div>
            <PhotoWall photos={home.photos} label="Lavigo trip" />
          </div>
        </section>
      )}

      <section className="m-sec" id="plan">
        <div className="m-wrap">
          <div className="m-band">
            <div className="m-band-txt">
              <p className="m-kicker">Custom trip planner</p>
              <h2>Your dates, your group, your pace.</h2>
              <p>Start from your own city. Pick places, nights, hotels, cars and activities, see a day-by-day plan with an estimate, download it as a PDF and get the final quote on WhatsApp.</p>
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
            <div className="m-card m-step"><span>01</span><h3>Choose a departure</h3><p>Pick a fixed-date group trip, or plan a private one from your own city. Check the hotels, cars and itinerary first.</p></div>
            <div className="m-card m-step"><span>02</span><h3>Hold your seats</h3><p>Add each traveller and tell us if we should book your tickets. Seats are held for 24 hours. Nothing to pay online.</p></div>
            <div className="m-card m-step"><span>03</span><h3>Confirm on WhatsApp</h3><p>Pay the 25% advance on WhatsApp and we confirm. The balance is due before you travel.</p></div>
          </div>
        </div>
      </section>

      <section className="m-sec" id="about" style={{ paddingBottom: 64 }}>
        <div className="m-wrap m-about">
          <div className="m-card m-about-c">
            <div className="m-about-pic"><Image src={ABOUT_IMAGE} alt="Lavigo travellers with the Lavigo banner at Phewa Lake, Pokhara" fill sizes="(max-width:900px) 100vw, 400px" style={{ objectFit: 'cover' }} /></div>
            <div style={{ padding: 24 }}>
              <h2 className="m-h3">One team, trips for all of India</h2>
              <p className="m-muted" style={{ marginTop: 8 }}>{BUSINESS.name} plans every trip from our office in Ranchi and welcomes travellers from any city. A Lavigo trip leader travels with each group from the first day to the last.</p>
              <p className="m-sm" style={{ marginTop: 12 }}>{business.address}</p>
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
