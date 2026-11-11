'use client'
import { keepForm } from './keepForm'
import { useActionState, useEffect, useState } from 'react'
import { sendEnquiry, type EngageState } from '@/app/actions/engage'
import { BUSINESS } from '@/lib/config'
import { WhatsAppGlyph } from './Icons'
import { useMe } from './useMe'

const wa = (t: string) => `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(t)}`

type Props = {
  kind: 'custom' | 'question' | 'trip'
  trip?: { slug: string; title: string }
  destinations?: string[]
  title?: string
  intro?: string
  compact?: boolean
}

/** Enquiry to the owner. Saved to the admin inbox, then opens WhatsApp with everything filled in. */
export function EnquiryForm({ kind, trip, destinations = [], title, intro, compact }: Props) {
  const [s, action, busy] = useActionState<EngageState, FormData>(sendEnquiry, {})
  const me = useMe()
  const [opened, setOpened] = useState(false)
  useEffect(() => {
    if (s.ok && s.wa && !opened) {
      setOpened(true)
      window.open(wa(s.wa), '_blank', 'noopener')
    }
  }, [s, opened])

  if (s.ok && s.wa)
    return (
      <div className="eq-done" role="status">
        <b>Thank you, your enquiry is with Lavigo.</b>
        <span>We have also opened WhatsApp with your details, so you can send it straight to the owner. If it didn&apos;t open, tap below.</span>
        <a className="eq-wa" href={wa(s.wa)} target="_blank" rel="noopener"><WhatsAppGlyph /> Send on WhatsApp</a>
      </div>
    )

  return (
    <form onSubmit={keepForm(action)} className={'eq' + (compact ? ' eq-compact' : '')}>
      {title && <h3 className="eq-h">{title}</h3>}
      {intro && <p className="eq-intro">{intro}</p>}
      <input type="hidden" name="kind" value={kind} />
      {trip && <><input type="hidden" name="trip_slug" value={trip.slug} /><input type="hidden" name="trip" value={trip.title} /></>}
      <div className="hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="eq-g">
        <div><label className="eq-l" htmlFor={`eq-name-${kind}`}>Your name</label><input className="eq-in" id={`eq-name-${kind}`} name="name" required minLength={2} autoComplete="name" defaultValue={me.user?.name} key={me.user?.name} /></div>
        <div><label className="eq-l" htmlFor={`eq-phone-${kind}`}>WhatsApp number</label><input className="eq-in" id={`eq-phone-${kind}`} name="phone" required inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile" defaultValue={me.user?.phone} key={me.user?.phone} /></div>
        {kind === 'custom' && (
          <>
            <div>
              <label className="eq-l" htmlFor="eq-dest">Where to?</label>
              <input className="eq-in" id="eq-dest" name="destination" required list="eq-dests" placeholder="e.g. Sikkim, Kerala, Bali" />
              <datalist id="eq-dests">{destinations.map((d) => <option key={d} value={d} />)}</datalist>
            </div>
            <div><label className="eq-l" htmlFor="eq-from">Starting from</label><input className="eq-in" id="eq-from" name="start_city" placeholder="Your city" /></div>
            <div><label className="eq-l" htmlFor="eq-dates">When?</label><input className="eq-in" id="eq-dates" name="dates" placeholder="e.g. 20–25 Dec, or 'flexible'" /></div>
            <div><label className="eq-l" htmlFor="eq-trav">Travellers</label><input className="eq-in" id="eq-trav" name="travellers" placeholder="e.g. 2 adults, 1 child (8)" /></div>
            <div><label className="eq-l" htmlFor="eq-nights">Nights</label><input className="eq-in" id="eq-nights" name="nights" inputMode="numeric" placeholder="e.g. 5" /></div>
            <div><label className="eq-l" htmlFor="eq-budget">Budget per person <span>(optional)</span></label><input className="eq-in" id="eq-budget" name="budget" placeholder="e.g. ₹20,000" /></div>
          </>
        )}
        <div className="eq-full">
          <label className="eq-l" htmlFor={`eq-msg-${kind}`}>{kind === 'custom' ? 'Anything else we should know?' : 'Your question'}</label>
          <textarea className="eq-in" id={`eq-msg-${kind}`} name="message" rows={compact ? 3 : 4} required={kind !== 'custom'} placeholder={kind === 'custom' ? 'Hotel type, places you want to see, occasions, food preferences…' : 'Ask anything: dates, hotels, food, what to pack…'} />
        </div>
      </div>
      {s.error && <p className="au-msg bad" role="alert">{s.error}</p>}
      <button className="eq-btn" disabled={busy}><WhatsAppGlyph /> {busy ? 'Sending…' : kind === 'custom' ? 'Send enquiry to Lavigo' : 'Ask Lavigo on WhatsApp'}</button>
      <p className="eq-fine">The owner replies on WhatsApp, usually within a few hours.</p>
    </form>
  )
}
