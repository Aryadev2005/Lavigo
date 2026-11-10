'use client'
// A text box with a themed suggestion list of common Indian starting cities. Any city can be typed.
import { useRef, useState } from 'react'
import { Pop } from './Pickers'

export const CITIES = [
  'Ranchi', 'Patna', 'Kolkata', 'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Bhubaneswar', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Gaya', 'Varanasi', 'Prayagraj', 'Kanpur',
  'Guwahati', 'Siliguri', 'Raipur', 'Bhopal', 'Indore', 'Nagpur', 'Chandigarh', 'Dehradun', 'Surat', 'Kochi',
  'Visakhapatnam', 'Coimbatore', 'Durgapur', 'Asansol', 'Muzaffarpur', 'Bhagalpur', 'Hazaribagh', 'Deoghar', 'Rourkela', 'Noida', 'Gurugram',
]

type Props = { id: string; name?: string; value?: string; onChange?: (v: string) => void; placeholder?: string; required?: boolean; className?: string }

export function CityInput({ id, name, value, onChange, placeholder, required, className = 'inp' }: Props) {
  const [inner, setInner] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const ref = useRef<HTMLInputElement>(null)
  const v = value ?? inner
  const q = v.trim().toLowerCase()
  const hits = CITIES.filter((c) => c.toLowerCase().includes(q) && c.toLowerCase() !== q).slice(0, 8)
  const set = (t: string) => { setInner(t); onChange?.(t) }
  const pick = (c: string) => { set(c); setOpen(false); setActive(-1) }
  const onKey = (e: React.KeyboardEvent) => {
    if (!hits.length) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : hits.length)) % hits.length || 0) }
    else if (e.key === 'Enter' && open && active >= 0) { e.preventDefault(); pick(hits[active]) }
  }
  return (
    <>
      <input ref={ref} id={id} name={name} className={className} autoComplete="off" role="combobox" aria-expanded={open && hits.length > 0} aria-autocomplete="list" maxLength={60}
        placeholder={placeholder ?? 'Type your city'} required={required} value={v}
        onChange={(e) => { set(e.target.value); setOpen(true); setActive(-1) }} onFocus={() => setOpen(true)} onKeyDown={onKey} />
      {open && hits.length > 0 && ref.current && (
        <Pop anchor={ref.current} onClose={() => setOpen(false)} label="City suggestions">
          <ul role="listbox" className="pk-list">
            {hits.map((c, i) => <li key={c} role="option" aria-selected={i === active} className={i === active ? 'act' : ''}
              onPointerDown={(e) => e.preventDefault()} onPointerEnter={() => setActive(i)} onClick={() => pick(c)}>{c}</li>)}
          </ul>
        </Pop>
      )}
    </>
  )
}
