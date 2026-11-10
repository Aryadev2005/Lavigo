'use client'
import { useState } from 'react'
import { ImageField } from './ImageField'

type Field = { key: string; label: string; type?: 'text' | 'textarea' | 'number' | 'image' | 'select'; placeholder?: string; options?: [string, string][] }
type Row = Record<string, string>

/** Editable list of rows. The rows are serialised into one hidden JSON field named `name`. */
export function RowsEditor({ name, initial, fields, addLabel, itemLabel }: { name: string; initial: Row[]; fields: Field[]; addLabel: string; itemLabel?: string }) {
  const [rows, setRows] = useState<Row[]>(initial)
  const upd = (i: number, k: string, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const blank = () => Object.fromEntries(fields.map((f) => [f.key, f.type === 'select' ? f.options?.[0]?.[0] ?? '' : '']))
  const move = (i: number, d: number) => setRows((r) => { const j = i + d; if (j < 0 || j >= r.length) return r; const c = [...r]; [c[i], c[j]] = [c[j], c[i]]; return c })
  return (
    <div className="ad-rows">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="rowcard">
          <div className="tools">
            <span>{itemLabel ? `${itemLabel} ${i + 1}` : `#${i + 1}`}</span>
            <button type="button" className="btn b-ghost sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
            <button type="button" className="btn b-ghost sm" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down">↓</button>
            <button type="button" className="btn b-danger sm" onClick={() => setRows((x) => x.filter((_, j) => j !== i))}>Remove</button>
          </div>
          <div className="g2" style={{ gridTemplateColumns: fields.filter((f) => f.type !== 'textarea' && f.type !== 'image').length > 3 ? '1.4fr 1fr .8fr .6fr' : fields.filter((f) => f.type !== 'textarea' && f.type !== 'image').length > 2 ? '1fr 1fr 1fr' : fields.filter((f) => f.type !== 'textarea' && f.type !== 'image').length > 1 ? '1fr 2fr' : '1fr' }}>
            {fields.map((f) => (
              <div key={f.key} style={f.type === 'textarea' || f.type === 'image' ? { gridColumn: '1 / -1' } : undefined}>
                <label className="l">{f.label}</label>
                {f.type === 'textarea' ? <textarea className="inp sm" style={{ minHeight: 64 }} value={r[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => upd(i, f.key, e.target.value)} />
                  : f.type === 'image' ? <ImageField value={r[f.key] ?? ''} onChange={(v) => upd(i, f.key, v)} />
                  : f.type === 'select' ? <select className="inp sm" value={r[f.key] || f.options?.[0]?.[0] || ''} onChange={(e) => upd(i, f.key, e.target.value)}>{f.options?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  : <input className="inp sm" type={f.type === 'number' ? 'number' : 'text'} min={f.type === 'number' ? 0 : undefined} value={r[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => upd(i, f.key, e.target.value)} />}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="btn b-ghost" onClick={() => setRows((r) => [...r, blank()])}>+ {addLabel}</button>
    </div>
  )
}
