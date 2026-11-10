'use client'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Art } from './Art'
import { CityInput } from './CityInput'
import { DatePicker } from './Pickers'
import { Icon } from './Icons'
import { ADVANCE } from '@/lib/config'
import { addDays, fmtDate, inr, isoDate } from '@/lib/format'
import { DEFAULT_BUILDER, GROUND, TICKETS, TIERS, TRAVEL, encodePlan, quote, type Builder, type Ground, type Tier, type Travel } from '@/lib/pricing'
import { stars } from '@/lib/stays'
import type { Destination, TicketBy } from '@/lib/types'
import { waLink } from '@/lib/whatsapp'

function Stepper({ v, on, label }: { v: number; on: (d: number) => void; label: string }) {
  return (
    <div className="stepper"><button type="button" onClick={() => on(-1)} aria-label={`Fewer ${label}`}>−</button><output>{v}</output><button type="button" onClick={() => on(1)} aria-label={`More ${label}`}>+</button></div>
  )
}

function Opt<T extends string>({ value, cur, set, title, desc }: { value: T; cur: T; set: (v: T) => void; title: string; desc: string }) {
  return <button type="button" className={'opt' + (cur === value ? ' on' : '')} onClick={() => set(value)} aria-pressed={cur === value}><b>{title}</b><small>{desc}</small></button>
}

type Props = { destinations: Destination[]; minDate: string; initial?: { dest?: string; date?: string; pax?: number; from?: string } }

export function Planner({ destinations, minDate, initial }: Props) {
  const bySlug = useMemo(() => new Map(destinations.map((d) => [d.slug, d])), [destinations])
  const startDest = initial?.dest && bySlug.has(initial.dest) ? initial.dest : destinations[0]?.slug
  const [b, setB] = useState<Builder>(() => ({
    ...DEFAULT_BUILDER,
    dests: startDest ? { [startDest]: bySlug.get(startDest)!.default_nights } : {},
    order: startDest ? [startDest] : [],
    start: initial?.date && initial.date >= minDate ? initial.date : isoDate(addDays(minDate, 21)),
    from: (initial?.from ?? '').slice(0, 60),
    adults: Math.min(Math.max(initial?.pax ?? 2, 1), 20),
    acts: startDest ? bySlug.get(startDest)!.activities.filter((a) => a.p < 2000).slice(0, 2).map((a) => a.id) : [],
  }))
  const [tab, setTab] = useState<'plan' | 'inc'>('plan')
  const q = useMemo(() => quote(b, destinations), [b, destinations])
  const ok = q.ok
  const [other, setOther] = useState('')
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
  const names = q.stops
  const addOther = () => {
    const name = other.trim().replace(/\s+/g, ' ').slice(0, 60)
    if (name.length < 2 || b.others.some((o) => o.name.toLowerCase() === name.toLowerCase())) { setOther(''); return }
    const match = destinations.find((d) => d.name.toLowerCase() === name.toLowerCase())
    if (match) { if (!b.dests[match.slug]) toggleDest(match.slug); setOther(''); return }
    set({ others: [...b.others, { name, nights: 2 }].slice(0, 10) }); setOther('')
  }
  const otherNights = (i: number, d: number) => set({ others: b.others.map((o, j) => (j === i ? { ...o, nights: Math.max(1, Math.min(10, o.nights + d)) } : o)) })
  const removeOther = (i: number) => set({ others: b.others.filter((_, j) => j !== i) })
  const priceLabel = !ok ? '₹0' : q.priced ? inr(q.total) : 'On request'

  const waText = ok
    ? `Hi Lavigo, I'd like a quote for this trip:\n` +
      [...q.order.map((k) => `• ${bySlug.get(k)!.name}: ${b.dests[k]} nights`), ...q.others.map((o) => `• ${o.name}: ${o.nights} nights (please quote)`)].join('\n') +
      `\nStarting from: ${b.from.trim() || 'not decided'}` +
      `\nStart date: ${fmtDate(b.start, { day: 'numeric', month: 'short', year: 'numeric' })}\nTravellers: ${b.adults} adult${b.adults > 1 ? 's' : ''}${b.kids ? `, ${b.kids} child${b.kids > 1 ? 'ren' : ''}` : ''}` +
      `\nStay: ${TIERS[b.tier].name}` +
      `\nTickets: ${b.tickets === 'agency' ? `Lavigo to book (${TRAVEL[b.travel].name})` : 'I will book my own'}` +
      `\nGetting around: ${GROUND[b.ground].name}` +
      (q.chosen.length ? `\nExperiences: ${q.chosen.map((a) => a.n).join(', ')}` : '') +
      (q.priced ? `\nWebsite estimate: ${inr(q.total)} (${inr(q.perPerson)} per person)${q.others.length ? ` for ${q.order.map((k) => bySlug.get(k)!.name).join(' + ')}, plus the places above to quote` : ''}` : '')
    : 'Hi Lavigo, I want to plan a custom trip.'
  const pdfHref = ok ? `/plan/itinerary?dl=1&p=${encodePlan(b)}` : '#'

  return (
    <div className="bgrid has-bar pl">
      <div>
        <section className="card bstep"><h2 className="pl-h"><span className="n">1</span>Where do you want to go?</h2>
          <div className="dpick">
            {destinations.map((d) => (
              <button type="button" key={d.slug} className={'dopt' + (b.dests[d.slug] ? ' on' : '')} onClick={() => toggleDest(d.slug)} aria-pressed={!!b.dests[d.slug]}>
                <div className="mini">{d.hero_image ? <Image src={d.hero_image} alt="" fill sizes="160px" style={{ objectFit: 'cover' }} /> : <Art theme={d.theme} h={64} variant={2} id={d.slug} />}</div>
                <span className="ck">✓</span>
                <div className="t"><b>{d.name}</b><small>{d.area}</small></div>
              </button>
            ))}
          </div>
          {q.order.length > 0 && (
            <div className="nights"><span className="lbl" style={{ margin: '8px 0 0' }}>Nights at each place{q.order.length > 1 ? ', in this order' : ''}</span>
              {q.order.map((k, i) => (
                <div className="between" key={k}><b>{i + 1}. {bySlug.get(k)!.name}</b>
                  <div className="row">{q.order.length > 1 && i > 0 && <button type="button" className="btn b-ghost sm" onClick={() => moveUp(k)} aria-label={`Move ${bySlug.get(k)!.name} earlier`}>↑</button>}<Stepper v={b.dests[k]} on={(d) => nights(k, d)} label="nights" /></div>
                </div>))}
            </div>)}
          <div className="pl-other">
            <label htmlFor="p-other" className="lbl">Somewhere else? Type any place in India or abroad</label>
            <div className="pl-other-row">
              <input id="p-other" className="inp" value={other} maxLength={60} placeholder="e.g. Kashmir, Andaman, Bali, Dubai"
                onChange={(e) => setOther(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOther() } }} />
              <button type="button" className="btn b-main" onClick={addOther} disabled={other.trim().length < 2}><Icon name="plus" size={18} />Add</button>
            </div>
            {q.others.length > 0 && (
              <div className="nights" style={{ marginTop: 10 }}>
                {b.others.map((o, i) => (
                  <div className="between" key={o.name}>
                    <b><Icon name="compass" size={18} /> {o.name}</b>
                    <div className="row">
                      <Stepper v={o.nights} on={(d) => otherNights(i, d)} label={`nights in ${o.name}`} />
                      <button type="button" className="pl-x" onClick={() => removeOther(i)} aria-label={`Remove ${o.name}`}><Icon name="close" size={16} /></button>
                    </div>
                  </div>
                ))}
                <p className="pl-fine" style={{ marginTop: 0 }}>We plan and price these places for you on WhatsApp.</p>
              </div>
            )}
          </div>
        </section>

        <section className="card bstep"><h2 className="pl-h"><span className="n">2</span>From where, when and who?</h2>
          <div className="fld">
            <label htmlFor="p-from">Starting city</label>
            <CityInput id="p-from" value={b.from} onChange={(v) => set({ from: v.slice(0, 60) })} placeholder="Where does your trip start? e.g. Patna, Delhi, Bengaluru" />
          </div>
          <div className="two">
            <div className="fld"><label htmlFor="p-start">Start date</label><DatePicker id="p-start" min={minDate} value={b.start} onChange={(v) => set({ start: v })} /></div>
            <div className="fld"><label>Back home on</label><div className="inp pl-ro">{ok ? fmtDate(addDays(b.start, q.nights), { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}</div></div>
          </div>
          <div className="two who">
            <div className="between pl-who"><div><b>Adults</b><small>12+ years</small></div><Stepper v={b.adults} label="adults" on={(d) => set({ adults: Math.max(1, Math.min(20, b.adults + d)) })} /></div>
            <div className="between pl-who"><div><b>Children</b><small>5–11 years</small></div><Stepper v={b.kids} label="children" on={(d) => set({ kids: Math.max(0, Math.min(20, b.kids + d)) })} /></div>
          </div>
        </section>

        <section className="card bstep"><h2 className="pl-h"><span className="n">3</span>Where will you stay?</h2>
          <div className="seg c3">{(Object.keys(TIERS) as Tier[]).map((k) => <Opt key={k} value={k} cur={b.tier} set={(v) => set({ tier: v })} title={TIERS[k].name} desc={TIERS[k].desc} />)}</div>
          {q.hotels.length > 0 && (
            <>
              <p className="pl-sub">{TIERS[b.tier].name} hotels we use{q.order.length > 1 ? ` in ${names.join(' and ')}` : ''}</p>
              <ul className="pl-cards">
                {q.hotels.map((h) => (
                  <li key={h.dest + h.name}>
                    <span className="pl-ic"><Icon name="hotel" size={20} /></span>
                    <div><b>{h.name}</b><small>{h.place}{h.stars ? <> · <span className="pl-stars" aria-label={`${h.stars} star`}>{stars(h.stars)}</span></> : null}</small>{h.note && <p>{h.note}</p>}</div>
                  </li>
                ))}
              </ul>
              <p className="pl-fine">Final hotels are confirmed with your quote, subject to availability. We book these or similar.</p>
            </>
          )}
        </section>

        <section className="card bstep"><h2 className="pl-h"><span className="n">4</span>Getting there and around</h2>
          <span className="lbl">Train or flight tickets{b.from.trim() ? ` from ${b.from.trim()}` : ''}</span>
          <div className="seg c2">{(Object.keys(TICKETS) as TicketBy[]).map((k) => <Opt key={k} value={k} cur={b.tickets} set={(v) => set({ tickets: v })} title={TICKETS[k].name} desc={TICKETS[k].desc} />)}</div>
          {b.tickets === 'agency' && (
            <div className="seg c2" style={{ marginTop: 10 }}>{(Object.keys(TRAVEL) as Travel[]).map((k) => <Opt key={k} value={k} cur={b.travel} set={(v) => set({ travel: v })} title={TRAVEL[k].name} desc={TRAVEL[k].desc} />)}</div>
          )}
          <span className="lbl" style={{ marginTop: 18 }}>At the destination</span>
          <div className="seg c2">{(Object.keys(GROUND) as Ground[]).map((k) => <Opt key={k} value={k} cur={b.ground} set={(v) => set({ ground: v })} title={GROUND[k].name} desc={GROUND[k].desc} />)}</div>
          {q.cars.length > 0 && (
            <>
              <p className="pl-sub">{b.ground === 'private' ? `Cars for ${q.pax} traveller${q.pax > 1 ? 's' : ''}` : 'Vehicles used on this route'}</p>
              <ul className="pl-cards">
                {q.cars.map((c) => (
                  <li key={c.name}>
                    <span className="pl-ic sun"><Icon name="car" size={20} /></span>
                    <div><b>{c.name}</b><small>{c.kind} · {c.seats} seats{b.ground === 'private' && q.carCount > 1 && c.seats < q.pax ? ` · ${Math.ceil(q.pax / c.seats)} cars` : ''}</small>{c.note && <p>{c.note}</p>}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="card bstep"><h2 className="pl-h"><span className="n">5</span>Add experiences</h2>
          {q.order.length ? (
            <div className="acts">{q.order.map((k) => bySlug.get(k)!.activities.map((a) => (
              <label key={a.id} className={'act' + (b.acts.includes(a.id) ? ' on' : '')}>
                <input type="checkbox" checked={b.acts.includes(a.id)} onChange={() => toggleAct(a.id)} />
                <div className="x"><b>{a.n}</b><small>{bySlug.get(k)!.name} · {a.where}</small></div>
              </label>)))}</div>
          ) : <p className="muted">Pick a place to see experiences.</p>}
        </section>
      </div>

      <div>
        <div className="card sumcard" id="sum">
          <div className="sumhead">
            <small>{ok ? `${q.nights} nights · ${q.pax} traveller${q.pax > 1 ? 's' : ''} · ${names.join(' + ')}` : 'Your trip'}</small>
            <div className="price">{priceLabel}</div>
            <small>{!ok ? 'Pick a place to see your price' : !q.priced ? 'Lavigo prices this trip on WhatsApp' : `About ${inr(q.perPerson)} per person · estimate${q.others.length ? `, plus ${q.others.map((o) => o.name).join(', ')}` : ''}`}</small>
          </div>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'plan'} className={tab === 'plan' ? 'on' : ''} onClick={() => setTab('plan')}>Day-by-day</button>
            <button type="button" role="tab" aria-selected={tab === 'inc'} className={tab === 'inc' ? 'on' : ''} onClick={() => setTab('inc')}>What&apos;s included</button>
          </div>
          <div className="sumbody">
            {!ok ? <p className="muted">Your plan appears here.</p> : tab === 'plan' ? q.days.map((d) => (
              <div className="dayl" key={d.n}>
                <div className="d"><small>DAY</small><b>{d.n}</b><small>{fmtDate(d.date)}</small></div>
                <div><h4>{d.title}</h4><p>{d.text}</p></div>
              </div>)) : (
              <div className="pl-inc">
                <h4>Included</h4>
                <ul>{q.included.map((x) => <li key={x} className="yes">{x}</li>)}</ul>
                <h4>Not included</h4>
                <ul>{q.excluded.map((x) => <li key={x} className="no">{x}</li>)}</ul>
              </div>)}
          </div>
          <div className="sumfoot">
            <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>This is an estimate. Lavigo confirms the final price and hotels on WhatsApp. A {ADVANCE * 100}% advance{q.priced ? ` (${inr(q.advance)})` : ''} confirms a custom trip.</p>
            <a className={'btn b-wa b-block' + (ok ? '' : ' dis')} aria-disabled={!ok} style={ok ? undefined : { opacity: .45, pointerEvents: 'none' }} target="_blank" rel="noopener" href={waLink(waText)}>Get this quote on WhatsApp</a>
            <a className={'btn b-ghost b-block pl-dl' + (ok ? '' : ' dis')} aria-disabled={!ok} style={ok ? undefined : { opacity: .45, pointerEvents: 'none' }} target="_blank" rel="noopener" href={pdfHref}>
              <Icon name="download" size={18} />Download itinerary (PDF)
            </a>
          </div>
        </div>
      </div>

      <div className="mbar">
        <div><b>{priceLabel}</b><small>{ok ? `${q.nights}N · ${q.pax} travellers · estimate` : 'Pick a place'}</small></div>
        <a className="btn b-main" href="#sum">View plan</a>
      </div>
    </div>
  )
}
