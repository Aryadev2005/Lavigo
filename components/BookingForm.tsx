'use client'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { reserveSeats, type ReserveState } from '@/app/actions/booking'
import { ADVANCE, GST, HOLD_HOURS } from '@/lib/config'
import { fmtDate, inr } from '@/lib/format'

export type DepOption = { id: string; date: string; price: number; seatsLeft: number }

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return <button className="btn b-main b-block" disabled={disabled || pending}>{pending ? 'Holding your seats…' : 'Hold my seats →'}</button>
}

export function BookingForm({ departures, whatsappHref }: { departures: DepOption[]; whatsappHref: string }) {
  const firstOpen = departures.find((d) => d.seatsLeft > 0)
  const [depId, setDepId] = useState(firstOpen?.id ?? departures[0]?.id ?? '')
  const [pax, setPax] = useState(2)
  const [state, action] = useActionState<ReserveState, FormData>(reserveSeats, {})
  const dep = departures.find((d) => d.id === depId)

  if (!departures.length)
    return (
      <div style={{ padding: '18px 20px' }}>
        <p style={{ marginBottom: 12 }}><b>No dates are open right now.</b><br /><span className="muted">Message us and we will tell you the next departure.</span></p>
        <a className="btn b-wa b-block" href={whatsappHref} target="_blank" rel="noopener">Ask on WhatsApp</a>
      </div>
    )

  const max = Math.max(1, Math.min(dep?.seatsLeft ?? 1, 20))
  const n = Math.min(pax, max)
  const total = (dep?.price ?? 0) * n
  const full = !dep || dep.seatsLeft === 0

  return (
    <form action={action} style={{ padding: '18px 20px' }}>
      <input type="hidden" name="departure_id" value={depId} />
      <input type="hidden" name="travellers" value={n} />
      <div className="hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      <span className="lbl">Choose a date</span>
      {departures.map((d) => (
        <label key={d.id} className={'depopt' + (d.id === depId ? ' on' : '') + (d.seatsLeft === 0 ? ' full' : '')}>
          <input type="radio" name="dep_choice" checked={d.id === depId} disabled={d.seatsLeft === 0} onChange={() => setDepId(d.id)} />
          <span className="x"><b>{fmtDate(d.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</b>
            <small>{d.seatsLeft === 0 ? 'Sold out' : `${d.seatsLeft} seat${d.seatsLeft > 1 ? 's' : ''} left`} · {inr(d.price)} / person</small></span>
        </label>
      ))}

      <div className="between" style={{ margin: '14px 0 10px' }}>
        <span className="lbl" style={{ margin: 0 }}>Travellers</span>
        <div className="stepper">
          <button type="button" aria-label="Fewer travellers" onClick={() => setPax(Math.max(1, n - 1))}>−</button>
          <output aria-live="polite">{n}</output>
          <button type="button" aria-label="More travellers" onClick={() => setPax(Math.min(max, n + 1))}>+</button>
        </div>
      </div>

      <table className="brk">
        <tbody>
          <tr><td>{inr(dep?.price ?? 0)} × {n}</td><td>{inr(total)}</td></tr>
          <tr className="sub"><td>includes GST {GST * 100}%</td><td>{inr(total - total / (1 + GST))}</td></tr>
          <tr className="tot"><td>Total</td><td>{inr(total)}</td></tr>
        </tbody>
      </table>
      <div className="between" style={{ background: 'var(--lav3)', borderRadius: 12, padding: '10px 12px', margin: '6px 0 16px' }}>
        <span>Advance to confirm ({ADVANCE * 100}%)</span><b>{inr(Math.round(total * ADVANCE))}</b>
      </div>

      <div className="fld"><label htmlFor="b-name">Your full name</label><input id="b-name" name="name" className="inp" autoComplete="name" required minLength={2} maxLength={80} /></div>
      <div className="fld"><label htmlFor="b-phone">WhatsApp number</label><input id="b-phone" name="phone" className="inp" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" required /></div>
      <div className="fld"><label htmlFor="b-email">Email <span style={{ fontWeight: 400 }}>(optional)</span></label><input id="b-email" name="email" type="email" className="inp" autoComplete="email" /></div>
      {n > 1 && <div className="fld"><label htmlFor="b-others">Other travellers&apos; names <span style={{ fontWeight: 400 }}>(optional, can add later)</span></label><input id="b-others" name="others" className="inp" maxLength={300} placeholder="Separate names with commas" /></div>}

      {state.error && <div className="errbox" role="alert">{state.error}</div>}
      <Submit disabled={full} />
      <p className="secure" style={{ textAlign: 'center' }}>Your seats are held for {HOLD_HOURS} hours. Confirm and pay the advance on WhatsApp.</p>
    </form>
  )
}
