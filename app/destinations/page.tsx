import type { Metadata } from 'next'
import Link from 'next/link'
import { DestinationCard } from '@/components/DestinationCard'
import { Icon } from '@/components/Icons'
import { JsonLd } from '@/components/JsonLd'
import { SITE_URL } from '@/lib/config'
import { getDestinationSummaries } from '@/lib/destinations'
import { pageMeta } from '@/lib/seo'
import './destinations.css'

export const revalidate = 60
export const metadata: Metadata = pageMeta({
  title: 'Destinations: Nepal, Darjeeling, Sikkim & more',
  description: 'Where Lavigo travels: group trips from Ranchi to Nepal, Darjeeling, Sikkim and Netarhat, and private trips to Puri, Goa and more. Best time to go and prices.',
  path: '/destinations',
})

export default async function Destinations() {
  const all = await getDestinationSummaries()
  return (
    <div className="pg">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'ItemList', name: 'Lavigo destinations',
        itemListElement: all.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/destinations/${s.d.slug}`, name: s.d.name })),
      }} />
      <header className="pg-hero">
        <div className="m-wrap">
          <nav className="m-crumbs ds-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> › Destinations</nav>
          <p className="lv-eyebrow">Destinations</p>
          <h1 className="pg-h">Where we <em>travel.</em></h1>
          <p className="pg-sub">Fixed-date group trips from Ranchi to the hills and Nepal, and private trips on your own dates from any city in India. Pick a place to see when to go, what to see and the next departures.</p>
        </div>
      </header>
      <section className="m-sec">
        <div className="m-wrap">
          <div className="lv-dests">
            {all.map((s, i) => (
              <DestinationCard key={s.d.slug} d={s.d} cover={s.cover} nights={s.nights} fromPrice={s.fromPrice} hasGroupTrip={s.hasGroupTrip} priority={i < 3} />
            ))}
          </div>
          <div className="bp-cta ds-cta">
            <div><b>Somewhere else in mind?</b><span>We plan private trips anywhere in India and abroad, from your city, on your dates.</span></div>
            <Link href="/plan" className="lv-pill">Plan a custom trip <span aria-hidden="true"><Icon name="arrow" size={16} /></span></Link>
          </div>
        </div>
      </section>
    </div>
  )
}
