'use client'
import { useRef, useState } from 'react'
import { Icon } from '@/components/Icons'
import { sendPhoto } from './ImageField'

type Ph = { src: string; caption: string; wide?: boolean }

/**
 * A photo gallery: upload several photos at once (or drop them in), caption, reorder, remove.
 * Posts the list as JSON under `name`. `wideOption` adds a "wide" toggle (home photo wall).
 */
export function GalleryEditor({ name, initial, wideOption, coverLabel }: { name: string; initial: Ph[]; wideOption?: boolean; coverLabel?: string }) {
  const [list, setList] = useState<Ph[]>(initial)
  const [busy, setBusy] = useState(0)
  const [errs, setErrs] = useState<string[]>([])
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  async function add(files: FileList | File[] | null) {
    const fs = Array.from(files ?? []).filter((f) => /^image\//.test(f.type)).slice(0, 20)
    if (!fs.length) return
    setErrs([]); setBusy(fs.length)
    for (const f of fs) {
      const r = await sendPhoto(f)
      if (r.url) setList((l) => [...l, { src: r.url!, caption: '' }])
      else if (r.error) setErrs((e) => [...e, r.error!])
      setBusy((n) => n - 1)
    }
    if (input.current) input.current.value = ''
  }
  const upd = (i: number, v: Partial<Ph>) => setList((l) => l.map((p, j) => (j === i ? { ...p, ...v } : p)))
  const move = (i: number, d: number) => setList((l) => { const j = i + d; if (j < 0 || j >= l.length) return l; const c = [...l]; [c[i], c[j]] = [c[j], c[i]]; return c })

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(list)} />
      <div className="ad-gal">
        {list.map((p, i) => (
          <div className="ad-ph" key={p.src + i}>
            <div className="ad-ph-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.caption || `Photo ${i + 1}`} />
              <span className="ord">{i + 1}</span>
              {i === 0 && coverLabel && <span className="cover">{coverLabel}</span>}
            </div>
            <div className="ad-ph-b">
              <input className="inp sm" value={p.caption} onChange={(e) => upd(i, { caption: e.target.value })} placeholder="Caption (shown to visitors)" maxLength={140} aria-label={`Caption for photo ${i + 1}`} />
              {wideOption && (
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, color: 'var(--muted2)' }}>
                  <input type="checkbox" checked={!!p.wide} onChange={(e) => upd(i, { wide: e.target.checked })} />Show wide
                </label>
              )}
              <div className="row">
                <button type="button" className="btn b-ghost sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier"><Icon name="up" size={14} /></button>
                <button type="button" className="btn b-ghost sm" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move later"><Icon name="down" size={14} /></button>
                <button type="button" className="btn b-danger sm" onClick={() => setList((l) => l.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`}><Icon name="close" size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        <div className={'ad-drop' + (over ? ' over' : '')} role="button" tabIndex={0}
          onClick={() => input.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click() } }}
          onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files) }}>
          <div>
            <Icon name="image" size={26} />
            <b>{busy ? `Uploading ${busy}…` : 'Add photos'}</b>
            <small>Click or drop several at once. Big phone photos are shrunk automatically.</small>
          </div>
        </div>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => add(e.target.files)} />
      {errs.length > 0 && <div className="ad-flash err" style={{ marginTop: 10 }}><Icon name="alert" size={18} />{errs.join(' ')}</div>}
    </div>
  )
}
