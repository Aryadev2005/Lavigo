'use client'
import { keepForm } from './keepForm'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { submitReview, type EngageState } from '@/app/actions/engage'

const WORDS = ['', 'Poor', 'Okay', 'Good', 'Very good', 'Excellent']

export function ReviewForm({ name, booking }: { name: string; booking: string }) {
  const [s, action, busy] = useActionState<EngageState, FormData>(submitReview, {})
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  if (s.ok)
    return (
      <div className="eq-done" role="status">
        <b>Thank you for your review!</b>
        <span>The owner reads every review, and yours will appear on the website once it has been checked.</span>
        <Link href="/account" className="eq-wa" style={{ background: 'var(--lv-violet)' }}>Back to my trips</Link>
      </div>
    )
  const shown = hover || rating
  return (
    <form onSubmit={keepForm(action)} className="eq rv-form">
      <input type="hidden" name="booking" value={booking} />
      <input type="hidden" name="rating" value={rating || ''} />
      <div className="hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <fieldset className="rv-pick">
        <legend className="eq-l">Your rating</legend>
        <div className="rv-pick-row" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" className={i <= shown ? 'on' : ''} aria-label={`${i} star${i > 1 ? 's' : ''}: ${WORDS[i]}`} aria-pressed={rating === i}
              onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(0)} onClick={() => setRating(i)}>
              <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.8l2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z" /></svg>
            </button>
          ))}
          <span className="rv-pick-w" aria-live="polite">{WORDS[shown]}</span>
        </div>
      </fieldset>
      <div className="eq-g">
        <div><label className="eq-l" htmlFor="rv-name">Your name</label><input className="eq-in" id="rv-name" name="name" defaultValue={name} required minLength={2} maxLength={60} /></div>
        <div><label className="eq-l" htmlFor="rv-city">Your city <span>(optional)</span></label><input className="eq-in" id="rv-city" name="city" maxLength={60} placeholder="e.g. Patna" /></div>
        <div className="eq-full"><label className="eq-l" htmlFor="rv-title">Headline <span>(optional)</span></label><input className="eq-in" id="rv-title" name="title" maxLength={100} placeholder="e.g. Sunrise at Sarangkot was worth the 4 am alarm" /></div>
        <div className="eq-full"><label className="eq-l" htmlFor="rv-body">Your review</label><textarea className="eq-in" id="rv-body" name="body" rows={6} required minLength={20} maxLength={2000} placeholder="What did you love? What could be better?" /></div>
      </div>
      {s.error && <p className="au-msg bad" role="alert">{s.error}</p>}
      <button className="eq-btn" disabled={busy || !rating}>{busy ? 'Sending…' : 'Send review'}</button>
      {!rating && <p className="eq-fine">Choose a star rating to send your review.</p>}
    </form>
  )
}
