'use client'
import Image from 'next/image'
import { useState } from 'react'
import { Icon } from './Icons'

export type TimelineDay = {
  n: number
  date?: string
  title: string
  text: string
  highlights?: string[]
  meals?: string
  stay?: string
  travel?: string
  image?: string | null
}

/** Day-by-day as an expandable timeline, with "Expand all". Each day's summary line (meals/stay/travel) shows at a glance. */
export function ItineraryTimeline({ days }: { days: TimelineDay[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set())
  const allOpen = open.size === days.length && days.length > 0
  const toggle = (n: number) => setOpen((s) => { const c = new Set(s); if (c.has(n)) c.delete(n); else c.add(n); return c })
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(days.map((d) => d.n)))

  return (
    <div className="it-tl">
      <div className="it-tl-head">
        <h2 className="m-h3">Day by day</h2>
        <button type="button" className="m-btn-line" onClick={toggleAll}>{allOpen ? 'Collapse all' : 'Expand all'}</button>
      </div>
      {days.map((d) => {
        const isOpen = open.has(d.n)
        const at = [d.meals && `Meals: ${d.meals}`, d.stay && `Stay: ${d.stay}`, d.travel && `Travel: ${d.travel}`].filter(Boolean).join(' · ')
        return (
          <div className={'it-tl-day' + (isOpen ? ' open' : '')} key={d.n}>
            <button type="button" className="it-tl-sum" aria-expanded={isOpen} onClick={() => toggle(d.n)}>
              <span className="it-tl-n">{d.n}</span>
              <span className="it-tl-meta">
                <b>Day {d.n}{d.date ? ` · ${d.date}` : ''} · {d.title}</b>
                {at && <small>{at}</small>}
              </span>
              <span className="it-tl-chev"><Icon name="down" size={18} /></span>
            </button>
            {isOpen && (
              <div className="it-tl-body">
                {d.image && <div className="it-tl-pic"><Image src={d.image} alt={d.title} fill sizes="(max-width:900px) 100vw, 320px" style={{ objectFit: 'cover' }} /></div>}
                <div className="it-tl-text">
                  {d.text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
                  {d.highlights && d.highlights.length > 0 && <ul className="it-tl-hi">{d.highlights.map((h) => <li key={h}>{h}</li>)}</ul>}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
