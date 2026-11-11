'use client'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { reserveSeats, type ReserveState } from '@/app/actions/booking'
import { ageOn, isChild } from '@/lib/age'
import { ADVANCE, CHILD_FACTOR, CHILD_MAX_AGE, HOLD_HOURS } from '@/lib/config'
import { fmtDate, inr } from '@/lib/format'
import type { Gender, TicketBy } from '@/lib/types'
import { CityInput } from './CityInput'
import { Icon } from './Icons'
import { useMe } from './useMe'

export type DepOption = { id: string; date: string; price: number; seatsLeft: number; startCity: string }
type Pax = { name: string; gender: Gender | ''; dob: string }
const blank = (): Pax => ({ name: '', gender: '', dob: '' })
const today = () => new Date().toISOString().slice(0, 10)

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return <button className="bkf-submit" disabled={disabled || pending}>{pending ? 'Holding your seats…' : 'Hold my seats'}</button>
}

export function BookingForm({ departures, whatsappHref }: { departures: DepOption[]; whatsappHref: string }) {
  const firstOpen = departures.find((d) => d.seatsLeft > 0)
  const [depId, setDepId] = useState(firstOpen?.id ?? departures[0]?.id ?? '')
  const [pax, setPax] = useState<Pax[]>([blank(), blank()])
  const me = useMe()
  const [phone, setPhone] = useState('')
  const [path, setPath] = useState('/trips')
  useEffect(() => { setPath(window.location.pathname) }, [])
  // fill in what the account already knows, once
  useEffect(() => {
    if (!me.user) return
    if (me.user.phone) setPhone((v) => v || me.user!.phone)
    if (me.user.name) setPax((p) => (p[0].name ? p : [{ ...p[0], name: me.user!.name }, ...p.slice(1)]))
  }, [me.user])
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
  const day = dep?.date ?? today()
  const ages = list.map((p) => ageOn(p.dob, day))
  const kids = ages.filter((a) => isChild(a)).length
  const total = Math.round(list.reduce((sum, _p, i) => sum + (dep?.price ?? 0) * (isChild(ages[i]) ? CHILD_FACTOR : 1), 0))
  const noAdult = ages.every((a) => a !== null) && ages.every((a) => isChild(a))
  const full = !dep || dep.seatsLeft === 0
  const city = dep?.startCity || 'the starting point'

  const resize = (to: number) => {
    const k = Math.max(1, Math.min(max, to))
    setPax((p) => (k > p.length ? [...p, ...Array.from({ length: k - p.length }, blank)] : p.slice(0, k)))
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

      {!me.loading && !me.user && (
        <div className="bkf-gate">
          <span className="bkf-gate-ic" aria-hidden="true"><Icon name="user" size={22} /></span>
          <b>Sign in to book your seats</b>
          <p>Your Lavigo account keeps your bookings, itineraries and payments in one place. It takes a few seconds with Google or your email.</p>
          <Link className="bkf-submit" href={`/login?next=${encodeURIComponent(path)}`}>Sign in or create an account</Link>
          <a className="bkf-gate-wa" href={whatsappHref} target="_blank" rel="noopener">Or ask a question on WhatsApp</a>
        </div>
      )}
      {me.loading && <div className="bkf-gate bkf-gate-skel" aria-hidden="true" />}

      {me.user && <>
      <p className="bkf-who">Booking as <b>{me.user.email}</b></p>
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
            <div className="bkf-dob">
              <label className="bkf-l" htmlFor={`dob-${i}`}>Date of birth</label>
              <input id={`dob-${i}`} name="pax_dob" type="date" className="inp" value={p.dob} max={today()} min="1910-01-01"
                onChange={(e) => upd(i, { dob: e.target.value })} required />
              {ages[i] !== null && (
                <span className={'bkf-age' + (isChild(ages[i]) ? ' kid' : '')}>
                  {ages[i]} yrs · {isChild(ages[i]) ? `Child, pays ${CHILD_FACTOR * 100}%` : 'Adult'}
                </span>
              )}
            </div>
          </div>
        ))}
        <p className="bkf-hint">Ages are worked out on the day the trip starts. Children up to {CHILD_MAX_AGE} pay {CHILD_FACTOR * 100}% of the adult price. Please carry a government photo ID for every traveller (a birth certificate or school ID for children): the trip leader checks them at pick-up.</p>
        {noAdult && <p className="errbox" role="alert">At least one traveller must be an adult (over {CHILD_MAX_AGE}).</p>}
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
        <div className="fld" style={{ marginBottom: 0 }}><label htmlFor="b-phone">WhatsApp number</label><input id="b-phone" name="phone" className="inp" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" required value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <p className="bkf-hint" style={{ marginTop: 8 }}>Confirmation goes to {me.user.email} and this WhatsApp number.</p>
      </fieldset>

      <div className="bkf-total">
        <div><span>Total for {n} traveller{n > 1 ? 's' : ''}{kids ? ` (${kids} child${kids > 1 ? 'ren' : ''})` : ''}</span><b>{inr(total)}</b></div>
        <div className="adv"><span>Advance to confirm ({ADVANCE * 100}%)</span><b>{inr(Math.round(total * ADVANCE))}</b></div>
        <small>{ticket === 'agency' ? `Includes GST. Tickets to ${city} are quoted separately on WhatsApp.` : 'Includes GST.'}</small>
      </div>

      {state.error && <div className="errbox" role="alert">{state.error}</div>}
      <Submit disabled={full || noAdult} />
      <p className="bkf-note">Nothing to pay now. Seats are held for {HOLD_HOURS} hours while you confirm on WhatsApp.</p>
      </>}
    </form>
  )
}
