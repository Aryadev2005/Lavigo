import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/JsonLd'
import { TripCard } from '@/components/TripCard'
import { SITE_URL } from '@/lib/config'
import { getTrips } from '@/lib/data'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Group trips from Ranchi',
  description: 'Fixed-date group trips from Ranchi to Nepal, Darjeeling, Sikkim and Netarhat. Trip leader on every departure, prices with GST, seats held online.',
  alternates: { canonical: '/trips' },
}

export default async function Trips() {
  const trips = await getTrips()
  return (
    <section><div className="wrap">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: trips.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/trips/${t.slug}`, name: t.title })) }} />
      <div className="eyebrow">Fixed dates · trip leader on every trip</div>
      <h1 style={{ fontSize: 'clamp(28px,4.5vw,40px)', letterSpacing: '-.02em', marginBottom: 20 }}>Group trips from Ranchi</h1>
      <div className="grid3">{trips.map((t) => <TripCard key={t.id} trip={t} />)}</div>
      <div className="card" style={{ padding: 22, marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div><h3>Want different dates?</h3><p className="muted">Build a private trip for your family or friends.</p></div>
        <Link className="btn b-main" href="/plan">Plan a custom trip</Link>
      </div>
    </div></section>
  )
}
