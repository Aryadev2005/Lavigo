'use client'
import { useRef, useState } from 'react'
import { Icon } from '@/components/Icons'
import { sendFile } from './FileField'
import { sendPhoto } from './ImageField'

type Item = { type: 'photo' | 'video'; src: string; poster?: string; caption: string }

/** Photos and videos for a travel story, each with its own caption. Posts JSON under `name`. */
export function MediaEditor({ name, initial }: { name: string; initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const upd = (i: number, v: Partial<Item>) => setItems((x) => x.map((it, j) => (j === i ? { ...it, ...v } : it)))
  const move = (i: number, d: number) => setItems((x) => { const j = i + d; if (j < 0 || j >= x.length) return x; const c = [...x]; [c[i], c[j]] = [c[j], c[i]]; return c })

  async function add(files: FileList | null) {
    if (!files?.length) return
    setErr('')
    const list = [...files]
    for (let k = 0; k < list.length; k++) {
      const f = list[k]
      const video = f.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(f.name)
      setBusy(`Uploading ${k + 1} of ${list.length}${video ? ' (video, this can take a minute)' : ''}…`)
      const r = video ? await sendFile(f, (p) => setBusy(`Uploading video ${k + 1} of ${list.length}: ${p}%`)) : await sendPhoto(f)
      if (r.error) { setErr(r.error); continue }
      if (r.url) setItems((x) => [...x, { type: video ? 'video' : 'photo', src: r.url!, caption: '' }])
    }
    setBusy('')
    if (input.current) input.current.value = ''
  }

  return (
    <div className="ad-media">
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      {items.length === 0 && <div className="ad-empty" style={{ padding: 18 }}><b>No photos or videos yet</b>Add them below. Each one gets its own caption, shown under it in the story.</div>}
      {items.map((m, i) => (
        <div className="ad-media-row" key={m.src + i}>
          <div className="ad-media-pic">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {m.type === 'video' ? <video src={m.src} poster={m.poster} muted playsInline preload="metadata" /> : <img src={m.src} alt="" />}
            <span className="ad-media-type">{m.type === 'video' ? 'Video' : 'Photo'} {i + 1}</span>
          </div>
          <div className="ad-media-t">
            <label className="l" htmlFor={`cap-${i}`}>Caption / description</label>
            <textarea id={`cap-${i}`} className="inp sm" rows={3} value={m.caption} maxLength={300} onChange={(e) => upd(i, { caption: e.target.value })} placeholder={m.type === 'video' ? 'What is happening in this video?' : 'Where is this, and what was the moment?'} />
            <div className="ad-media-tools">
              <button type="button" className="btn b-ghost sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="up" size={14} /></button>
              <button type="button" className="btn b-ghost sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><Icon name="down" size={14} /></button>
              <button type="button" className="btn b-danger sm" onClick={() => setItems((x) => x.filter((_, j) => j !== i))}>Remove</button>
            </div>
          </div>
        </div>
      ))}
      <input ref={input} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" onChange={(e) => add(e.target.files)} />
      <div className="ad-media-add">
        <button type="button" className="btn b-ghost" disabled={!!busy} onClick={() => input.current?.click()}><Icon name="plus" size={16} />Add photos or videos</button>
        {busy && <span className="muted">{busy}</span>}
        {err && <span style={{ color: 'var(--bad)', fontSize: 13 }}>{err}</span>}
      </div>
      <p className="hint">Photos are resized automatically. Videos up to 200 MB (MP4 works everywhere; iPhone MOV files may not play in every browser).</p>
    </div>
  )
}
