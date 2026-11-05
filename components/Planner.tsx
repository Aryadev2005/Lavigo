'use client'
import { useMemo, useState } from 'react'
import { Art } from './Art'
import Image from 'next/image'
import { ADVANCE } from '@/lib/config'
import { addDays, fmtDate, inr, isoDate } from '@/lib/format'
import { MODES, TIERS, quote, type Builder, type Mode, type Tier } from '@/lib/pricing'
import type { Destination } from '@/lib/types'
import { waLink } from '@/lib/whatsapp'

function Stepper({ v, on }: { v: number; on: (d: number) => void }) {
  return (
    <div className="stepper"><button type="button" onClick={() => on(-1)} aria-label="Decrease">−</button><output>{v}</output><button type="button" onClick={() => on(1)} aria-label="Increase">+</button></div>
  )
}

type Props = { destinations: Destination[]; minDate: string; initial?: { dest?: string; date?: string; pax?: number } }

export function Planner({ destinations, minDate, initial }: Props) {
  const bySlug = useMemo(() => new Map(destinations.map((d) => [d.slug, d])), [destinations])
  const startDest = initial?.dest && bySlug.has(initial.dest) ? initial.dest : destinations[0]?.slug
  const [b, setB] = useState<Builder>(() => ({
    dests: startDest ? { [startDest]: bySlug.get(startDest)!.default_nights } : {},
    order: startDest ? [startDest] : [],
    start: initial?.date && initial.date >= minDate ? initial.date : isoDate(addDays(minDate, 21)),
    adults: Math.min(Math.max(initial?.pax ?? 2, 1), 20),
    kids: 0, tier: 'comfort', mode: 'train',
    acts: startDest ? bySlug.get(startDest)!.activities.filter((a) => a.p < 2000).slice(0, 2).map((a) => a.id) : [],
  }))
  const [tab, setTab] = useState<'plan' | 'price'>('plan')
  const q = useMemo(() => quote(b, destinations), [b, destinations])
  const ok = q.order.length > 0
  const set = (p: Partial<Builder>) => setB((x) => ({ ...x, ...p }))

  const toggleDest = (k: string) => {
    const D = bySlug.get(k)!
    if (b.dests[k]) {
      const { [k]: _, ...rest } = b.dests
      set({ dests: rest, order: b.order.filter((x) => x !== k), acts: b.acts.filter((a) => !D.activities.some((z) => z.id === a)) })
    } else set({ dests: { ...b.dests, [k]: Math.min(D.default_nights, 3) }, order: [...b.order, k] })
  }
  const nights = (k: string, d: number) => set({ dests: { ...b.dests, [k]: Math.max(1, Math.min(10, b.dests[k] + d)) } })
  const moveUp = (k: string) => { const i = b.order.indexOf(k); if (i > 0) { const o = [...b.order]; o.splice(i, 1); o.splice(i - 1, 0, k); set({ order: o }) } }
  const toggleAct = (id: string) => set({ acts: b.acts.includes(id) ? b.acts.filter((a) => a !== id) : [...b.acts, id] })

  const waText = ok
    ? `Hi Lavigo, I'd like a quote for this trip:\n` +
      q.order.map((k) => `• ${bySlug.get(k)!.name}: ${b.dests[k]} nights`).join('\n') +
      `\nStart: ${fmtDate(b.start, { day: 'numeric', month: 'short', year: 'numeric' })}\nTravellers: ${b.adults} adult${b.adults > 1 ? 's' : ''}${b.kids ? `, ${b.kids} child${b.kids > 1 ? 'ren' : ''}` : ''}` +
      `\nStay: ${TIERS[b.tier].name} · Travel: ${MODES[b.mode].name}` +
      (q.chosen.length ? `\nExperiences: ${q.chosen.map((a) => a.n).join(', ')}` : '') +
      `\nWebsite estimate: ${inr(q.total)} (${inr(q.perPerson)} per person, incl. GST)`
    : 'Hi Lavigo, I want to plan a custom trip.'

  return (
    <div className="bgrid has-bar">
      <div>
        <div className="card bstep"><h3><span className="n">1</span>Where do you want to go?</h3>
          <div className="dpick">
            {destinations.map((d) => (
              <button key={d.slug} className={'dopt' + (b.dests[d.slug] ? ' on' : '')} onClick={() => toggleDest(d.slug)} aria-pressed={!!b.dests[d.slug]}>
                <div className="mini">{d.hero_image ? <Image src={d.hero_image} alt="" fill sizes="160px" style={{ objectFit: 'cover' }} /> : <Art theme={d.theme} h={64} variant={2} id={d.slug} />}</div>
                <span className="ck">✓</span>
                <div className="t"><b>{d.name}</b><small>{d.area}</small></div>
              </button>
            ))}
          </div>
          {q.order.length > 0 && (
            <div className="nights"><span className="lbl" style={{ margin: '8px 0 0' }}>Nights at each place{q.order.length > 1 ? ' · in this order' : ''}</span>
              {q.order.map((k, i) => (
                <div className="between" key={k}><b>{i + 1}. {bySlug.get(k)!.name}</b>
                  <div className="row">{q.order.length > 1 && i > 0 && <button type="button" className="btn b-ghost sm" onClick={() => moveUp(k)} aria-label={`Move ${bySlug.get(k)!.name} earlier`}>↑</button>}<Stepper v={b.dests[k]} on={(d) => nights(k, d)} /></div>
                </div>))}
            </div>)}
        </div>

        <div className="card bstep"><h3><span className="n">2</span>When and who?</h3>
          <div className="two">
            <div className="fld"><label htmlFor="p-start">Start date</label><input id="p-start" className="inp" type="date" min={minDate} value={b.start} onChange={(e) => e.target.value && set({ start: e.target.value })} /></div>
            <div className="fld"><label>Ends on</label><div className="inp" style={{ background: 'var(--lav3)' }}>{ok ? fmtDate(addDays(b.start, q.nights), { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}</div></div>
          </div>
          <div className="two who">
            <div className="between card" style={{ padding: '10px 12px' }}><div><b>Adults</b><small className="muted" style={{ display: 'block', fontSize: 12 }}>12+ years</small></div><Stepper v={b.adults} on={(d) => set({ adults: Math.max(1, Math.min(20, b.adults + d)) })} /></div>
            <div className="between card" style={{ padding: '10px 12px' }}><div><b>Children</b><small className="muted" style={{ display: 'block', fontSize: 12 }}>5–11 years</small></div><Stepper v={b.kids} on={(d) => set({ kids: Math.max(0, Math.min(20, b.kids + d)) })} /></div>
          </div>
        </div>

        <div className="card bstep"><h3><span className="n">3</span>Where will you stay?</h3>
          <div className="seg c3">{(Object.keys(TIERS) as Tier[]).map((k) => {
            const avg = q.order.length ? q.order.reduce((s, d) => s + bySlug.get(d)![`rate_${k}` as const], 0) / q.order.length : 0
            return <button key={k} className={'opt' + (b.tier === k ? ' on' : '')} onClick={() => set({ tier: k })} aria-pressed={b.tier === k}><b>{TIERS[k].name}</b><small>{TIERS[k].desc}</small><div className="p">{avg ? `from ${inr(avg)} / room / night` : ''}</div></button>
          })}</div>
        </div>

        <div className="card bstep"><h3><span className="n">4</span>How will you travel?</h3>
          <div className="seg c3">{(Object.keys(MODES) as Mode[]).map((k) => <button key={k} className={'opt' + (b.mode === k ? ' on' : '')} onClick={() => set({ mode: k })} aria-pressed={b.mode === k}><b>{MODES[k].name}</b><small>{MODES[k].desc}</small></button>)}</div>
        </div>

        <div className="card bstep"><h3><span className="n">5</span>Add experiences</h3>
          {q.order.length ? (
            <div className="acts">{q.order.map((k) => bySlug.get(k)!.activities.map((a) => (
              <label key={a.id} className={'act' + (b.acts.includes(a.id) ? ' on' : '')}>
                <input type="checkbox" checked={b.acts.includes(a.id)} onChange={() => toggleAct(a.id)} />
                <div className="x"><b>{a.n}</b><small>{bySlug.get(k)!.name} · {a.where}</small></div>
                <b>{a.p ? inr(a.p) : 'Free'}</b>
              </label>)))}</div>
          ) : <p className="muted">Pick a place to see experiences.</p>}
        </div>
      </div>

      <div>
        <div className="card sumcard" id="sum">
          <div className="sumhead">
            <small>{ok ? `${q.nights} nights · ${q.pax} traveller${q.pax > 1 ? 's' : ''} · ${q.order.map((k) => bySlug.get(k)!.name).join(' + ')}` : 'Your trip'}</small>
            <div className="price">{ok ? inr(q.total) : '₹0'}</div>
            <small>{ok ? `${inr(q.perPerson)} per person · incl. GST · estimate` : 'Pick a place to see your price'}</small>
          </div>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'plan'} className={tab === 'plan' ? 'on' : ''} onClick={() => setTab('plan')}>Day-by-day</button>
            <button role="tab" aria-selected={tab === 'price'} className={tab === 'price' ? 'on' : ''} onClick={() => setTab('price')}>Price breakdown</button>
          </div>
          <div className="sumbody">
            {!ok ? <p className="muted">Your plan appears here.</p> : tab === 'plan' ? q.days.map((d) => (
              <div className="dayl" key={d.n}>
                <div className="d"><small>DAY</small><b>{d.n}</b><small>{fmtDate(d.date)}</small></div>
                <div><h4>{d.title}</h4><p>{d.text}</p></div>
                {d.cost > 0 && <span className="amt">{inr(d.cost)}</span>}
              </div>)) : (
              <table className="brk"><tbody>
                {q.lines.map((l) => <tr key={l[0]}><td>{l[0]}</td><td>{inr(l[1])}</td></tr>)}
                <tr className="sub"><td>Subtotal</td><td>{inr(q.sub)}</td></tr>
                <tr className="sub"><td>GST 5%</td><td>{inr(q.gst)}</td></tr>
                <tr className="tot"><td>Estimated total</td><td>{inr(q.total)}</td></tr>
              </tbody></table>)}
          </div>
          <div className="sumfoot">
            <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>This is an estimate. Lavigo confirms the final price and availability on WhatsApp. A {ADVANCE * 100}% advance ({ok ? inr(q.advance) : '₹0'}) confirms a custom trip.</p>
            <a className={'btn b-wa b-block' + (ok ? '' : ' dis')} aria-disabled={!ok} style={ok ? undefined : { opacity: .45, pointerEvents: 'none' }} target="_blank" rel="noopener" href={waLink(waText)}>Get this quote on WhatsApp</a>
          </div>
        </div>
      </div>

      <div className="mbar">
        <div><b>{inr(q.total)}</b><small>{ok ? `${q.nights}N · ${q.pax} travellers · estimate` : 'Pick a place'}</small></div>
        <a className="btn b-main" href="#sum">View plan</a>
      </div>
    </div>
  )
}
