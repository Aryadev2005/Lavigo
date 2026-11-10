'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Themed replacements for <select> and <input type="date">. Both submit through a hidden input when given a `name`.

export function Pop({ anchor, onClose, children, label }: { anchor: HTMLElement; onClose: () => void; children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const place = useCallback(() => {
    const el = ref.current
    if (!el) return
    const r = (anchor.closest('.m-field') ?? anchor).getBoundingClientRect()
    const h = el.offsetHeight
    const below = window.innerHeight - r.bottom
    const top = below < h + 12 && r.top > below ? Math.max(8, r.top - h - 6) : r.bottom + 6
    el.style.top = top + 'px'
    el.style.minWidth = r.width + 'px'
    el.style.left = Math.max(8, Math.min(r.left, window.innerWidth - el.offsetWidth - 8)) + 'px'
  }, [anchor])
  useLayoutEffect(place)
  useEffect(() => {
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node) && !anchor.contains(e.target as Node)) onClose() }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place) }
  }, [anchor, onClose, place])
  return createPortal(<div ref={ref} className="pk-pop" role="dialog" aria-label={label} data-lenis-prevent>{children}</div>, document.body)
}

type Opt = { value: string; label: string }
type SelectProps = { options: Opt[]; value?: string; defaultValue?: string; onChange?: (v: string) => void; name?: string; id?: string; className?: string; ariaLabel?: string; disabled?: boolean; placeholder?: string }

export function Select({ options, value, defaultValue, onChange, name, id, className = 'inp', ariaLabel, disabled, placeholder }: SelectProps) {
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? '')
  const v = value ?? inner
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const btn = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const cur = options.find((o) => o.value === v)
  const pick = (o: Opt) => { setInner(o.value); onChange?.(o.value); setOpen(false); btn.current?.focus() }
  const show = () => { setActive(Math.max(0, options.findIndex((o) => o.value === v))); setOpen(true) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return show()
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length)
    } else if ((e.key === 'Enter' || e.key === ' ') && open) { e.preventDefault(); pick(options[active]) }
    else if (e.key === 'Tab') close()
  }
  return (
    <>
      {name && <input type="hidden" name={name} value={v} />}
      <button ref={btn} id={id} type="button" className={className + ' pk-btn' + (cur ? '' : ' empty')} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} disabled={disabled}
        onClick={() => (open ? close() : show())} onKeyDown={onKey}>
        {cur?.label ?? placeholder ?? 'Select'}
      </button>
      {open && btn.current && (
        <Pop anchor={btn.current} onClose={close} label={ariaLabel ?? 'Options'}>
          <ul role="listbox" className="pk-list">
            {options.map((o, i) => (
              <li key={o.value} role="option" aria-selected={o.value === v} className={(o.value === v ? 'sel ' : '') + (i === active ? 'act' : '')}
                onPointerEnter={() => setActive(i)} onClick={() => pick(o)}>{o.label}</li>
            ))}
          </ul>
        </Pop>
      )}
    </>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return { y, m: m - 1, d } }
const label = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type DateProps = { value?: string; defaultValue?: string; onChange?: (v: string) => void; min?: string; name?: string; id?: string; className?: string; ariaLabel?: string; required?: boolean }

export function DatePicker({ value, defaultValue, onChange, min, name, id, className = 'inp', ariaLabel, required }: DateProps) {
  const [inner, setInner] = useState(defaultValue ?? '')
  const v = value ?? inner
  const [open, setOpen] = useState(false)
  const today = iso(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  const [view, setView] = useState(() => { const b = parse(v || min || today); return { y: b.y, m: b.m } })
  const btn = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const first = new Date(view.y, view.m, 1).getDay()
  const days = new Date(view.y, view.m + 1, 0).getDate()
  const go = (n: number) => setView(({ y, m }) => { const t = new Date(y, m + n, 1); return { y: t.getFullYear(), m: t.getMonth() } })
  const canPrev = !min || iso(view.y, view.m, 1) > min
  return (
    <>
      {name && <input type="hidden" name={name} value={v} />}
      {/* a hidden input can't be "required", so a tiny off-screen text input carries the browser's required check */}
      {required && <input className="pk-req" tabIndex={-1} aria-hidden="true" required value={v} onChange={() => {}} />}
      <button ref={btn} id={id} type="button" className={className + ' pk-btn pk-date' + (v ? '' : ' empty')} aria-haspopup="dialog" aria-expanded={open} aria-label={ariaLabel}
        onClick={() => { const b = parse(v || min || today); setView({ y: b.y, m: b.m }); setOpen((o) => !o) }}>
        {v ? label(v) : 'Select date'}
      </button>
      {open && btn.current && (
        <Pop anchor={btn.current} onClose={close} label="Choose a date">
          <div className="pk-cal">
            <div className="pk-cal-head">
              <button type="button" onClick={() => go(-1)} disabled={!canPrev} aria-label="Previous month">‹</button>
              <b>{MONTHS[view.m]} {view.y}</b>
              <button type="button" onClick={() => go(1)} aria-label="Next month">›</button>
            </div>
            <div className="pk-cal-grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="dow">{d}</span>)}
              {Array.from({ length: first }, (_, i) => <span key={'e' + i} />)}
              {Array.from({ length: days }, (_, i) => {
                const s = iso(view.y, view.m, i + 1)
                return <button key={s} type="button" disabled={!!min && s < min} className={(s === v ? 'sel ' : '') + (s === today ? 'today' : '')}
                  onClick={() => { setInner(s); onChange?.(s); close(); btn.current?.focus() }}>{i + 1}</button>
              })}
            </div>
          </div>
        </Pop>
      )}
    </>
  )
}
