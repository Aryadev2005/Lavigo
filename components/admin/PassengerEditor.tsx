'use client'
import { useState } from 'react'
import { Icon } from '@/components/Icons'
import { ageOn, isChild } from '@/lib/age'
import type { Gender } from '@/lib/types'

type P = { name: string; gender: Gender | ''; dob?: string; id_checked?: boolean }

/**
 * Travellers with name + gender. Posts pax_name[] and pax_gender[] (same order).
 * `max` caps the count (seats available); `perPerson` shows the running total.
 */
export function PassengerEditor({ initial, max = 20, perPerson, onCount, day }: { initial: P[]; max?: number; perPerson?: number; onCount?: (n: number) => void; day?: string }) {
  const [rows, setRows] = useState<P[]>(initial.length ? initial : [{ name: '', gender: '' }])
  const set = (next: P[]) => { setRows(next); onCount?.(next.length) }
  const upd = (i: number, v: Partial<P>) => set(rows.map((r, j) => (j === i ? { ...r, ...v } : r)))
  const m = rows.filter((r) => r.gender === 'male').length
  const f = rows.filter((r) => r.gender === 'female').length
  const kids = rows.filter((r) => isChild(ageOn(r.dob, day ?? new Date().toISOString().slice(0, 10)))).length
  const limit = Math.max(1, Math.min(20, max))
  return (
    <div>
      {rows.map((r, i) => (
        <div className="ad-pax" key={i}>
          <span className="n" aria-hidden="true">{i + 1}</span>
          <input className="inp" name="pax_name" value={r.name} onChange={(e) => upd(i, { name: e.target.value })} required minLength={2} maxLength={80}
            placeholder={i === 0 ? 'Lead traveller (full name)' : 'Full name'} aria-label={`Traveller ${i + 1} name`} />
          <div className="ad-seg" role="radiogroup" aria-label={`Traveller ${i + 1} gender`}>
            <label className={'m' + (r.gender === 'male' ? ' on' : '')}><input type="radio" name={`g_${i}`} checked={r.gender === 'male'} onChange={() => upd(i, { gender: 'male' })} required />Male</label>
            <label className={'f' + (r.gender === 'female' ? ' on' : '')}><input type="radio" name={`g_${i}`} checked={r.gender === 'female'} onChange={() => upd(i, { gender: 'female' })} required />Female</label>
          </div>
          <input type="hidden" name="pax_gender" value={r.gender} />
          <div className="ad-pax-age">
            <input className="inp sm" type="date" name="pax_dob" value={r.dob ?? ''} max={new Date().toISOString().slice(0, 10)} onChange={(e) => upd(i, { dob: e.target.value })} aria-label={`Traveller ${i + 1} date of birth`} title="Date of birth" />
            {(() => { const a = ageOn(r.dob, day ?? new Date().toISOString().slice(0, 10)); return a === null ? <span className="muted">age?</span> : <span className={'ad-agechip' + (isChild(a) ? ' kid' : '')}>{a} · {isChild(a) ? 'child' : 'adult'}</span> })()}
            <label className="ad-idchk" title="Tick once you have seen a photo ID with this date of birth"><input type="checkbox" checked={!!r.id_checked} onChange={(e) => upd(i, { id_checked: e.target.checked })} />ID checked</label>
            <input type="hidden" name="pax_id" value={r.id_checked ? 'yes' : ''} />
          </div>
          {rows.length > 1
            ? <button type="button" className="ad-x" onClick={() => set(rows.filter((_, j) => j !== i))} aria-label={`Remove traveller ${i + 1}`}><Icon name="close" size={15} /></button>
            : <span />}
        </div>
      ))}
      <div className="ad-pax-foot">
        <button type="button" className="btn b-ghost sm" disabled={rows.length >= limit} onClick={() => set([...rows, { name: '', gender: '' }])}>
          <Icon name="plus" size={15} />Add traveller
        </button>
        <span className="ad-gbar">
          <span className="m"><span className="dot" />{m} male</span>
          <span className="f"><span className="dot" />{f} female</span>
          {kids > 0 && <span className="muted" style={{ fontWeight: 600 }}>· {kids} child{kids > 1 ? 'ren' : ''}</span>}
          <span className="muted" style={{ fontWeight: 500 }}>· {rows.length} traveller{rows.length > 1 ? 's' : ''}{rows.length >= limit && limit < 20 ? ` (max ${limit}, seats left)` : ''}</span>
          {perPerson !== undefined && <b style={{ marginLeft: 6 }}>₹{(perPerson * rows.length).toLocaleString('en-IN')}</b>}
        </span>
      </div>
    </div>
  )
}
