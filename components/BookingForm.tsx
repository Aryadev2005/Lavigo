'use client'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { reserveSeats, type ReserveState } from '@/app/actions/booking'
import { ADVANCE, HOLD_HOURS } from '@/lib/config'
import { fmtDate, inr } from '@/lib/format'
import type { Gender, TicketBy } from '@/lib/types'
import { CityInput } from './CityInput'

export type DepOption = { id: string; date: string; price: number; seatsLeft: number; startCity: string }
type Pax = { name: string; gender: Gender | '' }

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return <button className="bkf-submit" disabled={disabled || pending}>{pending ? 'Holding your seats…' : 'Hold my seats'}</button>
}

export function BookingForm({ departures, whatsappHref }: { departures: DepOption[]; whatsappHref: string }) {
  const firstOpen = departures.find((d) => d.seatsLeft > 0)
  const [depId, setDepId] = useState(firstOpen?.id ?? departures[0]?.id ?? '')
  const [pax, setPax] = useState<Pax[]>([{ name: '', gender: '' }, { name: '', gender: '' }])
  const [ticket, setTicket] = useState<TicketBy>('agency')
  const [state, action] = useActionState<ReserveState, FormData>(reserveSeats, {})
  const dep = departures.find((d) => d.id === depId)

  if (!departures.length)
    return (
      <div className="bkf">
        <p className="bkf-empty"><b>No dates are open right now.</b><span>Message us and we will tell you the next departure.</span></p>
        <a className="btn b-wa b-block" href={whatsappHref} target="_blank" rel="noopener">Ask on WhatsApp</a>
      </div>
    )

  const max = Math.max(1, Math.min(dep?.seatsLeft ?? 1, 20))
  const list = pax.slice(0, max)
  const n = list.length
  const total = (dep?.price ?? 0) * n
  const full = !dep || dep.seatsLeft === 0
  const city = dep?.startCity || 'the starting point'

  const resize = (to: number) => {
    const k = Math.max(1, Math.min(max, to))
    setPax((p) => (k > p.length ? [...p, ...Array.from({ length: k - p.length }, () => ({ name: '', gender: '' as const }))] : p.slice(0, k)))
  }
  const upd = (i: number, v: Partial<Pax>) => setPax((p) => p.map((x, j) => (j === i ? { ...x, ...v } : x)))

  return (
    <form action={action} className="bkf">
      <input type="hidden" name="departure_id" value={depId} />
      <div className="hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      <fieldset className="bkf-sec">
        <legend>Choose a date</legend>
        {departures.map((d) => (
          <label key={d.id} className={'bkf-dep' + (d.id === depId ? ' on' : '') + (d.seatsLeft === 0 ? ' full' : '')}>
            <input type="radio" name="dep_choice" checked={d.id === depId} disabled={d.seatsLeft === 0} onChange={() => setDepId(d.id)} />
            <span className="x">
              <b>{fmtDate(d.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</b>
              <small>Starts from {d.startCity} · {d.seatsLeft === 0 ? 'Sold out' : `${d.seatsLeft} seat${d.seatsLeft > 1 ? 's' : ''} left`}</small>
            </span>
            <span className="p">{inr(d.price)}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="bkf-sec">
        <div className="bkf-row">
          <legend>Travellers</legend>
          <div className="stepper">
            <button type="button" aria-label="Fewer travellers" onClick={() => resize(n - 1)}>−</button>
            <output aria-live="polite">{n}</output>
            <button type="button" aria-label="More travellers" onClick={() => resize(n + 1)}>+</button>
          </div>
        </div>
        {list.map((p, i) => (
          <div className="bkf-pax" key={i}>
            <label className="bkf-l" htmlFor={`pax-${i}`}>{i === 0 ? 'Traveller 1 (you)' : `Traveller ${i + 1}`}</label>
            <input id={`pax-${i}`} name="pax_name" className="inp" value={p.name} onChange={(e) => upd(i, { name: e.target.value })}
              autoComplete={i === 0 ? 'name' : 'off'} placeholder="Full name as on ID" required minLength={2} maxLength={80} />
            <div className="bkf-gender" role="radiogroup" aria-label={`Gender of traveller ${i + 1}`}>
              {(['male', 'female'] as const).map((g) => (
                <label key={g} className={p.gender === g ? 'on' : undefined}>
                  <input type="radio" name={`pax_gender_${i}`} value={g} checked={p.gender === g} onChange={() => upd(i, { gender: g })} required />
                  {g === 'male' ? 'Male' : 'Female'}
                </label>
              ))}
            </div>
            <input type="hidden" name="pax_gender" value={p.gender} />
          </div>
        ))}
      </fieldset>

      <fieldset className="bkf-sec">
        <legend>Train or flight tickets to {city}</legend>
        <div className="bkf-opts">
          <label className={ticket === 'agency' ? 'on' : undefined}>
            <input type="radio" name="ticket_by" value="agency" checked={ticket === 'agency'} onChange={() => setTicket('agency')} />
            <b>Lavigo books them</b><small>We book from your city and add the fare to your quote.</small>
          </label>
          <label className={ticket === 'self' ? 'on' : undefined}>
            <input type="radio" name="ticket_by" value="self" checked={ticket === 'self'} onChange={() => setTicket('self')} />
            <b>I&apos;ll book my own</b><small>Meet the group in {city}. Choose this if you live there.</small>
          </label>
        </div>
        {ticket === 'agency' && (
          <div className="fld" style={{ marginTop: 12, marginBottom: 0 }}>
            <label htmlFor="b-from">Travelling from</label>
            <CityInput id="b-from" name="from_city" required placeholder="Your city, e.g. Patna" />
          </div>
        )}
      </fieldset>

      <fieldset className="bkf-sec">
        <legend>Contact</legend>
        <div className="fld"><label htmlFor="b-phone">WhatsApp number</label><input id="b-phone" name="phone" className="inp" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" required /></div>
        <div className="fld" style={{ marginBottom: 0 }}><label htmlFor="b-email">Email <span style={{ fontWeight: 400 }}>(optional)</span></label><input id="b-email" name="email" type="email" className="inp" autoComplete="email" /></div>
      </fieldset>

      <div className="bkf-total">
        <div><span>Total for {n} traveller{n > 1 ? 's' : ''}</span><b>{inr(total)}</b></div>
        <div className="adv"><span>Advance to confirm ({ADVANCE * 100}%)</span><b>{inr(Math.round(total * ADVANCE))}</b></div>
        <small>{ticket === 'agency' ? `Includes GST. Tickets to ${city} are quoted separately on WhatsApp.` : 'Includes GST.'}</small>
      </div>

      {state.error && <div className="errbox" role="alert">{state.error}</div>}
      <Submit disabled={full} />
      <p className="bkf-note">Nothing to pay now. Seats are held for {HOLD_HOURS} hours while you confirm on WhatsApp.</p>
    </form>
  )
}
