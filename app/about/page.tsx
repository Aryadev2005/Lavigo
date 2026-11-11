import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Accent } from '@/components/HeroScene'
import { Icon, type IconName } from '@/components/Icons'
import { JsonLd } from '@/components/JsonLd'
import { ReviewStrip } from '@/components/Reviews'
import { BUSINESS, SITE_URL } from '@/lib/config'
import { getReviews } from '@/lib/content'
import { TRIP_PHOTOS } from '@/lib/media'
import { getSite } from '@/lib/site'
import { waLink } from '@/lib/whatsapp'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'About us',
  description: 'Lavigo Travel Co. plans group trips and private holidays from Ranchi for travellers from every city in India. Meet the founder, Lucky Thapa.',
  alternates: { canonical: '/about' },
}

const ICONS: IconName[] = ['route', 'leader', 'rupee', 'pin', 'shield', 'hotel']

export default async function About() {
  const [{ about, business }, reviews] = await Promise.all([getSite(), getReviews(3)])
  const photos = about.photos.length ? about.photos : TRIP_PHOTOS.slice(0, 5)
  const story = about.story.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const initials = about.founderName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="pg">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'AboutPage', url: `${SITE_URL}/about`,
        mainEntity: { '@type': 'TravelAgency', '@id': `${SITE_URL}/#agency`, name: BUSINESS.name, founder: { '@type': 'Person', name: about.founderName, jobTitle: about.founderRole } },
      }} />
      <header className="pg-hero">
        <div className="m-wrap">
          <p className="lv-eyebrow">About Lavigo</p>
          <h1 className="pg-h"><Accent text={about.title} /></h1>
          <p className="pg-sub">{about.intro}</p>
        </div>
      </header>

      <section className="m-sec">
        <div className="m-wrap ab-founder">
          <figure className="ab-photo">
            {about.founderPhoto
              ? <Image src={about.founderPhoto} alt={`${about.founderName}, ${about.founderRole}`} fill sizes="(max-width:900px) 100vw, 420px" style={{ objectFit: 'cover' }} />
              : <span className="ab-initials" aria-hidden="true">{initials}</span>}
          </figure>
          <div className="ab-founder-t">
            <p className="lv-eyebrow">The founder</p>
            <h2 className="ab-name">{about.founderName}</h2>
            <p className="ab-role">{about.founderRole}</p>
            <p className="ab-bio">{about.founderBio}</p>
            <div className="ab-acts">
              <a href={waLink(`Hi ${about.founderName.split(' ')[0]}, I'd like to plan a trip with Lavigo.`)} target="_blank" rel="noopener" className="lv-pill">Talk to {about.founderName.split(' ')[0]} <span aria-hidden="true"><Icon name="chat" size={15} /></span></a>
              <a href={business.instagram} target="_blank" rel="noopener" className="lv-pill lv-pill-soft">Follow on Instagram</a>
            </div>
          </div>
        </div>
      </section>

      <section className="m-sec ab-story-sec">
        <div className="m-wrap ab-story">
          <h2 className="ab-h2">Our <em>story</em></h2>
          <div className="ab-story-t">{story.map((p, i) => <p key={i}>{p}</p>)}</div>
        </div>
      </section>

      <section className="m-sec">
        <div className="m-wrap">
          <div className="m-sec-h"><div><h2>What you can count on</h2></div></div>
          <div className="ab-values">
            {about.values.map((v, i) => (
              <div key={v.title} className="ab-value"><span className="ab-value-ic"><Icon name={ICONS[i % ICONS.length]} size={22} /></span><b>{v.title}</b><p>{v.text}</p></div>
            ))}
          </div>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="m-sec">
          <div className="m-wrap">
            <div className="m-sec-h"><div><h2>On the road with Lavigo</h2><p>Real travellers, real trips.</p></div><Link href="/blog" className="m-more">Travel stories <Icon name="arrow" size={18} /></Link></div>
            <div className="ab-photos">
              {photos.slice(0, 5).map((p, i) => (
                <figure key={p.src} className={'ab-ph' + (i === 0 ? ' big' : '')}>
                  <Image src={p.src} alt={p.caption} fill sizes={i === 0 ? '(max-width:700px) 100vw, 50vw' : '(max-width:700px) 50vw, 25vw'} style={{ objectFit: 'cover' }} />
                  <figcaption>{p.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="m-sec"><div className="m-wrap"><ReviewStrip reviews={reviews} /></div></section>

      <section className="m-sec" style={{ paddingBottom: 72 }}>
        <div className="m-wrap">
          <div className="ab-visit">
            <div>
              <h2 className="ab-h2">Visit <em>the office</em></h2>
              <p>{business.address}</p>
              <p><a href={`tel:${BUSINESS.phoneE164}`}>{BUSINESS.phoneDisplay}</a>{business.email ? <> · <a href={`mailto:${business.email}`}>{business.email}</a></> : null}</p>
            </div>
            <div className="ab-acts">
              <Link href="/trips" className="lv-pill">See group trips <span aria-hidden="true"><Icon name="arrow" size={16} /></span></Link>
              <Link href="/plan" className="lv-pill lv-pill-soft">Plan a private trip</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
