'use client'
import { useState } from 'react'
import { createBooking } from '@/app/admin/actions'
import { Icon } from '@/components/Icons'
import { PassengerEditor } from './PassengerEditor'

export type DepOpt = { id: string; label: string; price: number; seatsLeft: number; startCity: string }

export function NewBookingForm({ deps, preselect }: { deps: DepOpt[]; preselect?: string }) {
  const [depId, setDepId] = useState(preselect && deps.some((d) => d.id === preselect) ? preselect : '')
  const [price, setPrice] = useState('')
  const [count, setCount] = useState(1)
  const [ticket, setTicket] = useState<'agency' | 'self'>('self')
  const [confirm, setConfirm] = useState(false)
  const dep = deps.find((d) => d.id === depId)
  const per = price.trim() !== '' && Number.isFinite(Number(price)) ? Math.max(0, Math.round(Number(price))) : dep?.price ?? 0
  const total = per * count

  return (
    <form action={createBooking}>
      <div className="ad-detail">
        <div>
          <div className="card pane">
            <h2 className="ad-h2">Departure</h2>
            <p className="ad-sub">Only open dates with free seats are listed.</p>
            <select className="inp" name="departure_id" value={depId} onChange={(e) => setDepId(e.target.value)} required aria-label="Departure">
              <option value="">Choose a departure…</option>
              {deps.map((d) => <option key={d.id} value={d.id} disabled={d.seatsLeft === 0}>{d.label} · {d.seatsLeft === 0 ? 'full' : `${d.seatsLeft} left`}</option>)}
            </select>
            {dep && <p className="hint">Starts from {dep.startCity}. List price ₹{dep.price.toLocaleString('en-IN')} per person.</p>}
          </div>

          <div className="card pane">
            <h2 className="ad-h2">Travellers</h2>
            <p className="ad-sub">Full names as on ID, and male or female for each person.</p>
            <PassengerEditor initial={[]} max={dep ? dep.seatsLeft : 20} perPerson={dep ? per : undefined} onCount={setCount} />
          </div>

          <div className="card pane">
            <h2 className="ad-h2">Contact &amp; tickets</h2>
            <div className="g2" style={{ marginTop: 10 }}>
              <div className="fld"><label className="l" htmlFor="n-phone">Mobile (WhatsApp)</label><input id="n-phone" className="inp" name="phone" inputMode="numeric" placeholder="10-digit mobile" required /></div>
              <div className="fld"><label className="l" htmlFor="n-email">Email (optional)</label><input id="n-email" className="inp" name="email" type="email" /></div>
            </div>
            <div className="g2">
              <div className="fld"><label className="l" htmlFor="n-tk">Train / flight tickets</label>
                <select id="n-tk" className="inp" name="ticket_by" value={ticket} onChange={(e) => setTicket(e.target.value as 'agency' | 'self')}>
                  <option value="self">Traveller books their own</option><option value="agency">Lavigo books them</option>
                </select></div>
              {ticket === 'agency' && <div className="fld"><label className="l" htmlFor="n-from">Travelling from</label><input id="n-from" className="inp" name="from_city" placeholder="e.g. Patna" required /></div>}
            </div>
            <div className="fld"><label className="l" htmlFor="n-note">Private note (optional)</label><textarea id="n-note" className="inp" name="admin_note" placeholder="e.g. Booked on the phone; wants a lower berth" style={{ minHeight: 70 }} /></div>
          </div>
        </div>

        <div className="ad-sticky">
          <div className="card ad-money">
            <small className="muted" style={{ fontWeight: 600 }}>Total</small>
            <div className="big">₹{total.toLocaleString('en-IN')}</div>
            <div className="row"><span>{count} × ₹{per.toLocaleString('en-IN')}</span><b /></div>
            <div className="row muted"><span>Advance (25%)</span><b>₹{Math.round(total * 0.25).toLocaleString('en-IN')}</b></div>
            <div className="fld" style={{ marginTop: 10 }}>
              <label className="l" htmlFor="n-price">Price per person (₹)</label>
              <input id="n-price" className="inp" name="price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={dep ? String(dep.price) : 'List price'} />
              <p className="hint">Leave empty for the list price. Change it for a negotiated rate.</p>
            </div>
          </div>
          <div className="card pane" style={{ marginTop: 14 }}>
            <label className="chk"><input type="checkbox" name="confirm" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /><span><b>Payment received now</b><small>Confirm straight away instead of holding the seats for 24 hours.</small></span></label>
            {confirm && (
              <div style={{ marginTop: 12 }}>
                <div className="fld"><label className="l" htmlFor="n-amt">Amount received (₹)</label><input id="n-amt" className="inp" name="amount" inputMode="numeric" defaultValue={Math.round(total * 0.25) || ''} required /></div>
                <div className="fld"><label className="l" htmlFor="n-m">Paid by</label>
                  <select id="n-m" className="inp" name="method" defaultValue="upi"><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank">Bank transfer</option><option value="card">Card</option><option value="other">Other</option></select></div>
              </div>
            )}
            <button className="btn b-main b-block lg" disabled={!dep}><Icon name="check" size={18} />{confirm ? 'Create & confirm' : 'Create & hold seats'}</button>
          </div>
        </div>
      </div>
    </form>
  )
}
