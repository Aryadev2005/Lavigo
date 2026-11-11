import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/Icons'
import { ReviewCard, Stars } from '@/components/Reviews'
import { getReviews, reviewStats } from '@/lib/content'
import { waLink } from '@/lib/whatsapp'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Reviews',
  description: 'What travellers say about their Lavigo group trips and custom holidays.',
  alternates: { canonical: '/reviews' },
}

export default async function ReviewsPage() {
  const reviews = await getReviews(120)
  const stats = reviewStats(reviews)
  return (
    <div className="pg">
      <header className="pg-hero">
        <div className="m-wrap">
          <p className="lv-eyebrow">Reviews</p>
          <h1 className="pg-h">In their <em>own words.</em></h1>
          <p className="pg-sub">Every review here comes from a traveller with a Lavigo account, and the owner reads each one.</p>
          <div className="pg-hero-acts">
            {stats && <span className="rv-score"><b>{stats.avg.toFixed(1)}</b><Stars n={Math.round(stats.avg)} size={18} /><span>{stats.count} review{stats.count > 1 ? 's' : ''}</span></span>}
            <Link href="/reviews/new" className="lv-pill">Write a review <span aria-hidden="true"><Icon name="star" size={15} /></span></Link>
          </div>
        </div>
      </header>
      <section className="m-sec">
        <div className="m-wrap">
          {reviews.length
            ? <div className="rv-grid rv-grid-all">{reviews.map((r) => <ReviewCard key={r.id} r={r} />)}</div>
            : <div className="rv-empty"><Icon name="quote" size={28} /><p>No reviews yet. Travelled with Lavigo? <Link href="/reviews/new">Write the first one</Link>, or <a href={waLink('Hi Lavigo, I want to share feedback about my trip.')} target="_blank" rel="noopener">send feedback on WhatsApp</a>.</p></div>}
        </div>
      </section>
    </div>
  )
}
