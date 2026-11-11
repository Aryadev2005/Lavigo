import Link from 'next/link'
import { deleteReview, moderateReview } from '../../actions'
import { ConfirmButton } from '@/components/admin/ConfirmButton'
import { Flash, Head, rel } from '@/components/admin/ui'
import { Stars } from '@/components/Reviews'
import { listReviewsAdmin } from '@/lib/admin-extra'

export const metadata = { title: 'Reviews' }

export default async function ReviewsAdmin({ searchParams }: { searchParams: Promise<{ s?: string; ok?: string; err?: string }> }) {
  const sp = await searchParams
  const tab = sp.s ?? 'pending'
  const list = await listReviewsAdmin(tab)
  const here = `/admin/reviews?s=${tab}`
  return (
    <>
      <Head title="Reviews" sub="Customers write reviews from their account. Nothing appears on the website until you approve it. You can reply publicly too." />
      <Flash ok={sp.ok} err={sp.err} />
      <nav className="ad-tabs" aria-label="Filter">
        {[['pending', 'Waiting'], ['approved', 'On the website'], ['hidden', 'Hidden'], ['all', 'All']].map(([k, l]) => <Link key={k} href={`/admin/reviews?s=${k}`} className={tab === k ? 'on' : undefined}>{l}</Link>)}
      </nav>
      {list === null ? <div className="card ad-empty"><b>Needs the database update</b>Run 008_accounts_reviews_blog.sql in Supabase to switch on reviews.</div>
        : list.length === 0 ? <div className="card ad-empty"><b>No reviews here</b>{tab === 'pending' ? 'New reviews from customers wait here for you.' : 'Nothing in this list yet.'}</div>
        : (
          <div className="ad-cards">
            {list.map((r) => (
              <article key={r.id} className="card pane ad-rv">
                <div className="ad-enq-top">
                  <Stars n={r.rating} />
                  <span className={'ad-chip ' + r.status}>{r.status === 'pending' ? 'Waiting' : r.status === 'approved' ? 'On the website' : 'Hidden'}</span>
                  <span className="muted">{rel(r.created_at)}</span>
                </div>
                {r.title && <h3>{r.title}</h3>}
                <p className="ad-enq-msg">{r.body}</p>
                <p className="muted">— {r.name}{r.city ? `, ${r.city}` : ''}{r.trip ? <> · <a href={`/trips/${r.trip.slug}`} target="_blank" rel="noopener">{r.trip.title}</a></> : ''}{r.booking_id ? ' · verified booking' : ''}</p>
                <form action={moderateReview} className="ad-rv-f">
                  <input type="hidden" name="id" value={r.id} /><input type="hidden" name="back" value={here} />
                  <textarea className="inp sm" name="reply" defaultValue={r.reply} placeholder="Public reply from Lavigo (optional)" rows={2} />
                  <div className="ad-rv-acts">
                    {r.status !== 'approved' && <button className="btn b-main sm" name="status" value="approved">Approve &amp; publish</button>}
                    {r.status === 'approved' && <button className="btn b-ghost sm" name="status" value="approved">Save reply</button>}
                    {r.status !== 'hidden' && <button className="btn b-ghost sm" name="status" value="hidden">Hide</button>}
                  </div>
                </form>
                <form action={deleteReview}><input type="hidden" name="id" value={r.id} /><ConfirmButton className="btn b-danger sm" message="Delete this review for good?">Delete</ConfirmButton></form>
              </article>
            ))}
          </div>
        )}
    </>
  )
}
