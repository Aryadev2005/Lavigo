import Link from 'next/link'
import { fmtDate } from '@/lib/format'
import type { Review } from '@/lib/content'
import { Icon } from './Icons'
import { Title } from './Title'

export function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="rv-stars" role="img" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={i <= n ? 'on' : ''}>
          <path d="M12 3.8l2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z" />
        </svg>
      ))}
    </span>
  )
}

export function ReviewCard({ r, showTrip = true }: { r: Review; showTrip?: boolean }) {
  return (
    <article className="rv-card">
      <div className="rv-top"><Stars n={r.rating} /><span className="rv-date">{fmtDate(r.created_at.slice(0, 10), { month: 'short', year: 'numeric' })}</span></div>
      {r.title && <h3 className="rv-t">{r.title}</h3>}
      <p className="rv-b">{r.body}</p>
      <div className="rv-by">
        <span className="lv-avatar" aria-hidden="true">{r.name.slice(0, 1).toUpperCase()}</span>
        <span><b>{r.name}</b>{r.city ? `, ${r.city}` : ''}{showTrip && r.trip ? <> · <Link href={`/trips/${r.trip.slug}`}>{r.trip.title}</Link></> : null}</span>
      </div>
      {r.reply && <p className="rv-reply"><b>Reply from Lavigo</b>{r.reply}</p>}
    </article>
  )
}

export function ReviewStrip({ reviews, title = 'What travellers say', sub }: { reviews: Review[]; title?: string; sub?: string }) {
  return (
    <div className="rv-strip">
      <div className="m-sec-h">
        <div><Title text={title} />{sub && <p>{sub}</p>}</div>
        <div className="rv-strip-acts">
          {reviews.length > 0 && <Link href="/reviews" className="m-more">All reviews <Icon name="arrow" size={18} /></Link>}
          <Link href="/reviews/new" className="lv-pill lv-pill-soft">Review Lavigo <span aria-hidden="true"><Icon name="star" size={15} /></span></Link>
        </div>
      </div>
      {reviews.length > 0
        ? <div className="rv-grid">{reviews.map((r) => <ReviewCard key={r.id} r={r} />)}</div>
        : <div className="rv-empty"><Icon name="quote" size={28} /><p>Travelled with Lavigo? Your review helps the next group decide. <Link href="/reviews/new">Be the first to write one</Link>.</p></div>}
    </div>
  )
}
