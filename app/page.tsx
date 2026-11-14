import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment } from 'react'
import type { DepartureCardData } from '@/components/UpcomingDepartures'
import { Art } from '@/components/Art'
import { PhotoWall } from '@/components/Gallery'
import { Accent, FallingLeaves, HeroScene } from '@/components/HeroScene'
import { Icon, type IconName } from '@/components/Icons'
import { HomeSearch } from '@/components/HomeSearch'
import { JsonLd } from '@/components/JsonLd'
import { Moments } from '@/components/Moments'
import { ReviewWall } from '@/components/Reviews'
import AnimatedContent from '@/components/AnimatedContent'
import StarBorder from '@/components/StarBorder'
import SpotlightCard from '@/components/SpotlightCard'
import ScrollReveal from '@/components/ScrollReveal'
import { Title } from '@/components/Title'
import './home.css'
import { getReviews } from '@/lib/content'
import { UpcomingDepartures } from '@/components/UpcomingDepartures'
import { BUSINESS, SITE_URL } from '@/lib/config'
import { getDestinations, getTrips } from '@/lib/data'
import { addDays, inr, isoDate, todayISO } from '@/lib/format'
import { PLAN_IMAGE, REELS } from '@/lib/media'
import { pageMeta } from '@/lib/seo'
import { getSite } from '@/lib/site'
import { waLink } from '@/lib/whatsapp'

export const revalidate = 60
export const metadata: Metadata = pageMeta({
  title: 'Lavigo Travel Co. | Group trips to Nepal, Sikkim & Darjeeling',
  absoluteTitle: true,
  description: 'Group trips from Ranchi and across India to Nepal, Darjeeling, North Sikkim and Netarhat, plus custom holidays to Puri and Goa. Trip leader on every departure.',
  path: '/',
})

const FALLBACK: [string, string, string] = ['#3A0CA3', '#4CC9F0', '#F1FAEE']

const TRUST: { t: string; s: string; c: 'lav' | 'sun'; i: IconName }[] = [
  { t: 'Seats held 24 hours', s: 'Reserve now, pay later', c: 'lav', i: 'clock' },
  { t: 'Only 25% advance', s: 'Balance before you travel', c: 'sun', i: 'wallet' },
  { t: 'From anywhere in India', s: 'We can book your tickets', c: 'lav', i: 'pin' },
  { t: 'Trip leader on board', s: 'Every group departure', c: 'sun', i: 'leader' },
]

const STEPS: { t: string; p: string; i: IconName }[] = [
  { t: 'Choose a departure', p: 'Pick a fixed-date group trip, or plan a private one from your own city. Check the hotels, cars and itinerary first.', i: 'route' },
  { t: 'Hold your seats', p: 'Add each traveller and tell us if we should book your tickets. Seats are held for 24 hours. Nothing to pay online.', i: 'ticket' },
  { t: 'Confirm on WhatsApp', p: 'Pay the 25% advance on WhatsApp and we confirm. The balance is due before you travel.', i: 'chat' },
]

// the hero's jagged ridgeline, reused for every edge between light and dark on this page
const EDGE = 'M0 90 L0 52 L90 30 L170 58 L260 18 L350 50 L430 34 L520 64 L610 26 L700 56 L790 40 L880 66 L970 22 L1060 54 L1150 36 L1240 62 L1330 28 L1420 56 L1510 38 L1600 58 L1600 90 Z'

export default async function Home() {
  const [dests, trips, site, reviews] = await Promise.all([getDestinations(), getTrips(), getSite(), getReviews(12)])
  const { home, business } = site
  const FAQ = home.faqs
  const headLines = home.headline.split('\n').map((l) => l.trim()).filter(Boolean)
  const withDeps = trips.filter((t) => t.departures.length)
  const minDate = isoDate(addDays(todayISO(), 7))

  const departures = withDeps
    .flatMap((t) => t.departures.filter((d) => d.seats_left > 0).map((d) => ({ tripSlug: t.slug, title: t.destination?.name ?? t.title, dest: t.destination?.slug ?? '', date: d.depart_date, nights: t.nights, startCity: d.start_city })))
    .sort((a, b) => a.date.localeCompare(b.date))

  const departureCards: DepartureCardData[] = withDeps
    .flatMap((t) => t.departures.map((d) => ({
      key: d.id, slug: t.slug, title: t.title, image: t.image, theme: (t.destination?.theme ?? FALLBACK) as [string, string, string],
      nights: t.nights, date: d.depart_date, startCity: d.start_city, seatsLeft: d.seats_left, seatsTotal: d.seats_total, price: d.price,
    })))
    .sort((a, b) => a.date.localeCompare(b.date))

  const fromPrice = (slug: string) => {
    const ps = trips.filter((t) => t.destination?.slug === slug).flatMap((t) => t.departures.map((d) => d.price))
    return ps.length ? Math.min(...ps) : null
  }
  const tripFor = (slug: string) => withDeps.find((t) => t.destination?.slug === slug) ?? trips.find((t) => t.destination?.slug === slug)

  return (
    <div className="m-page lv-home">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: BUSINESS.name, alternateName: 'Lavigo', inLanguage: 'en-IN', publisher: { '@id': `${SITE_URL}/#agency` } }} />

      <FallingLeaves />
      <section className="lv-hero">
        <HeroScene />
        <div className="m-wrap lv-hero-in">
          <p className="lv-badge"><span aria-hidden="true" />{home.kicker}</p>
          <Title tag="h1" className="lv-h" text={home.headline} trigger="load" splitType="chars" mask={false} delay={55} duration={1.4} ease="power3.out" from={{ opacity: 0, y: 46, rotate: 6, filter: 'blur(12px)' }} to={{ opacity: 1, y: 0, rotate: 0, filter: 'blur(0px)' }} hoverEffect="lift" ignore=".lv-accent">{headLines.map((l, i) => <Fragment key={i}>{i > 0 && <br />}<span><Accent text={l} tone="light" /></span></Fragment>)}</Title>
          <p className="lv-intro">{home.intro}</p>
          <div className="lv-ctas">
            <Link href="/trips" className="lv-pill">Explore trips <span aria-hidden="true"><Icon name="arrow" size={16} /></span></Link>
            <Link href="/plan" className="lv-pill lv-pill-ghost">Plan a custom trip <span aria-hidden="true"><Icon name="route" size={16} /></span></Link>
          </div>
          <a href="#search" className="lv-mouse" aria-label="Scroll to search"><span /></a>
        </div>
        <svg className="lv-edge" viewBox="0 0 1600 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 90 L0 52 L90 30 L170 58 L260 18 L350 50 L430 34 L520 64 L610 26 L700 56 L790 40 L880 66 L970 22 L1060 54 L1150 36 L1240 62 L1330 28 L1420 56 L1510 38 L1600 58 L1600 90 Z" />
        </svg>
      </section>
      <div className="m-wrap lv-search" id="search">
        <HomeSearch destinations={dests.map((d) => ({ slug: d.slug, name: d.name, area: d.area }))} departures={departures} minDate={minDate} />
      </div>

      <section className="m-sec" style={{ paddingTop: 64 }}>
        <div className="m-wrap">
          <div className="m-trust">
            {TRUST.map((x) => (
              <div key={x.t}><span className={'m-ic ' + x.c}><Icon name={x.i} size={26} /></span><div><b>{x.t}</b><span>{x.s}</span></div></div>
            ))}
          </div>
        </div>
      </section>

      {departureCards.length > 0 && (
        <section className="m-sec">
          <div className="m-wrap">
            <div className="m-sec-h">
              <div><Title text="Upcoming group departures" /><p>{home.subline}</p></div>
              <Link href="/trips" className="m-more">View all trips <Icon name="arrow" size={18} /></Link>
            </div>
            <UpcomingDepartures departures={departureCards} />
          </div>
        </section>
      )}

      <section className="m-sec" id="destinations">
        <div className="m-wrap">
          <div className="m-sec-h"><div><Title text="Handpicked destinations" /><p>Join a group departure or plan a private trip on your own dates.</p></div></div>
          <AnimatedContent className="lv-dests" stagger={0.08} distance={30} duration={0.8}>
            {dests.map((d) => {
              const t = tripFor(d.slug)
              const p = fromPrice(d.slug)
              const cover = d.hero_image ?? t?.image ?? null
              const nights = t?.nights ?? d.default_nights
              return (
                <SpotlightCard key={d.slug} theme="light" spotlightColor="#8A6FD1" intensity={0.5} spotlightSize={260} borderGlow={0.8} className="lv-dest" style={{ ['--spotlight-card-border' as string]: 'var(--lv-line)' }}>
                  <Link href={t ? `/trips/${t.slug}` : `/plan?dest=${d.slug}`} className="lv-dest-in">
                    <span className="lv-dest-pic">
                      {cover
                        ? <Image src={cover} alt="" fill sizes="(max-width:600px) 100vw, (max-width:1000px) 50vw, 33vw" style={{ objectFit: 'cover' }} />
                        : <Art theme={d.theme} h={220} variant={1} id={'d' + d.slug} />}
                      <span className="lv-dest-tag">{t ? 'Group trip' : 'Private trip'}</span>
                    </span>
                    <span className="lv-dest-body">
                      <b>{d.name}</b>
                      <small><Icon name="pin" size={14} />{d.area}</small>
                      <span className="lv-dest-foot">
                        <span>{nights} nights{p && <> · from <em>{inr(p)}</em></>}</span>
                        <span className="ud-go" aria-hidden="true"><Icon name="arrow" size={16} /></span>
                      </span>
                    </span>
                  </Link>
                </SpotlightCard>
              )
            })}
          </AnimatedContent>
        </div>
      </section>

      <section className="lv-moments" id="moments">
        <div className="m-wrap">
          <div className="m-sec-h">
            <div><Title text="Trip moments" /><p>Short videos from our recent Nepal group trip.</p></div>
            <a href={business.instagram} target="_blank" rel="noopener" className="m-more">More on Instagram <Icon name="arrow" size={18} /></a>
          </div>
        </div>
        <Moments reels={REELS} instagram={business.instagram} />
      </section>

      <section className="m-sec lv-quote" aria-label="The Lavigo promise">
        <div className="m-wrap">
          <figure>
            <span className="lv-quote-mark" aria-hidden="true"><Icon name="quote" size={40} /></span>
            <ScrollReveal containerClassName="lv-quote-t" baseOpacity={0.12} enableBlur blurStrength={6} baseRotation={0} wordAnimationEnd="center 50%">
              From the first morning on the road to the last sunset of the trip, a Lavigo trip leader travels with your group.
            </ScrollReveal>
            <figcaption><span />The Lavigo promise</figcaption>
          </figure>
        </div>
      </section>

      {home.photos.length > 0 && (
        <section className="m-sec" id="gallery">
          <div className="m-wrap">
            <div className="m-sec-h">
              <div><Title text={home.photosTitle} /><p>{home.photosText}</p></div>
              <Link href="/trips" className="m-more">See upcoming trips <Icon name="arrow" size={18} /></Link>
            </div>
            <PhotoWall photos={home.photos} label="Lavigo trip" max={5} />
          </div>
        </section>
      )}

      {/* dark chapter: the custom planner and how booking works, between mountain edges */}
      <section className="lv-chapter" id="plan">
        <svg className="lv-cut lv-cut-top" viewBox="0 0 1600 90" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d={EDGE} /></svg>
        <div className="m-wrap">
          <div className="lv-plan">
            <div className="lv-plan-txt">
              <p className="lv-eyebrow lv-eyebrow-l">Custom trip planner</p>
              <Title text="Your dates, your group, your pace." />
              <p>Start from your own city. Pick places, nights, hotels, cars and activities, see a day-by-day plan with an estimate, download it as a PDF and get the final quote on WhatsApp.</p>
              <div className="m-band-cta">
                <Link href="/plan" className="m-btn-sun">Plan my trip</Link>
                <a href={waLink('Hi Lavigo, I want to plan a private trip.')} target="_blank" rel="noopener" className="m-btn-ghost lv-ghost-l">Talk to us on WhatsApp</a>
              </div>
            </div>
            <AnimatedContent className="lv-plan-pic" distance={60} scale={0.94} blur={8} duration={1.1}>
              <Image src={PLAN_IMAGE} alt="Rocky coast in Goa" fill sizes="(max-width:900px) 100vw, 45vw" style={{ objectFit: 'cover' }} />
            </AnimatedContent>
          </div>

          <div className="lv-steps-h">
            <Title text="Booking takes three steps" />
            <p>No payment online. Your seats are held while we talk on WhatsApp.</p>
          </div>
          <div className="lv-steps">
            <AnimatedContent className="lv-route" wipe="right" duration={1.6} ease="power2.inOut" animateOpacity={false} distance={0}>
              <svg viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M20 20 C 180 -6, 320 46, 500 20 S 820 -6, 980 20" /></svg>
            </AnimatedContent>
            <AnimatedContent className="lv-steps-row" stagger={0.18} distance={40} blur={6} duration={0.9}>
              {STEPS.map((s, i) => (
                <div key={s.t} className="lv-step">
                  <span className="lv-step-ic"><Icon name={s.i} size={24} /><i>{i + 1}</i></span>
                  <h3>{s.t}</h3>
                  <p>{s.p}</p>
                </div>
              ))}
            </AnimatedContent>
          </div>
        </div>
        <svg className="lv-cut lv-cut-bot" viewBox="0 0 1600 90" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d={EDGE} /></svg>
      </section>

      {/* only real, approved reviews, and only once there are enough to read like a wall */}
      {reviews.length >= 3 && (
        <section className="m-sec" id="reviews"><ReviewWall reviews={reviews} /></section>
      )}

      <section className="m-sec lv-faq" id="about">
        <div className="m-wrap lv-faq-grid">
          <div className="lv-faq-intro">
            <p className="lv-eyebrow">Good to know</p>
            <Title text="Common questions" />
            <p>{BUSINESS.name} plans every trip from our office in Ranchi and welcomes travellers from any city. A Lavigo trip leader travels with each group from the first day to the last.</p>
            <p className="lv-faq-addr"><Icon name="pin" size={16} />{business.address}</p>
            <div className="lv-faq-links">
              <Link href="/about" className="m-more">More about Lavigo <Icon name="arrow" size={18} /></Link>
              <a href={waLink('Hi Lavigo, I have a question about a trip.')} target="_blank" rel="noopener" className="m-more">Ask us on WhatsApp <Icon name="arrow" size={18} /></a>
            </div>
          </div>
          <div className="lv-faq-list">
            {FAQ.map((f, i) => <details className="m-faq" key={f.q} open={i === 0}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </div>
        </div>
      </section>

      {/* closing band: the hero landscape again, leading straight into the footer */}
      <section className="lv-final">
        <svg className="lv-cut lv-cut-top" viewBox="0 0 1600 90" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d={EDGE} /></svg>
        <div className="lv-final-scene" aria-hidden="true">
          {['sky', 'peaks', 'hills'].map((n) => <Image key={n} src={'/img/hero/' + n + '.webp'} alt="" fill unoptimized className={'lv-final-' + n} />)}
        </div>
        <AnimatedContent className="m-wrap lv-final-in" stagger={0.12} distance={36} blur={6} duration={1}>
          <p className="lv-eyebrow lv-eyebrow-l">Your next trip starts here</p>
          <Title className="lv-final-h" text="Plan it with Lavigo" ignore=".lv-accent">Plan it with <Accent text="*Lavigo*" tone="light" /></Title>
          <p className="lv-final-p">Join a group departure with a trip leader, or tell us your dates and we will plan a private trip from your city.</p>
          <div className="lv-final-cta">
            <StarBorder as="a" href="/plan" className="lv-star" color="#FFC56B" trailColor="#C9B5F4" duration={5} thickness={1.5} radius={999} glow={0.8} backgroundColor="#FFFFFF" textColor="#1D1633">Plan my trip</StarBorder>
            <Link href="/trips" className="lv-pill lv-pill-ghost">See group departures <span aria-hidden="true"><Icon name="arrow" size={16} /></span></Link>
          </div>
        </AnimatedContent>
      </section>
    </div>
  )
}
