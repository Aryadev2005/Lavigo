'use client'
import { useRef, useState } from 'react'
import { signUpload } from '@/app/admin/actions'
import { Icon } from '@/components/Icons'

/** Sends a PDF or video straight from the browser to Supabase Storage (no size squeeze through the website). */
export async function sendFile(f: File, onProgress?: (pct: number) => void): Promise<{ url?: string; error?: string }> {
  const type = f.type || (/\.pdf$/i.test(f.name) ? 'application/pdf' : /\.mov$/i.test(f.name) ? 'video/quicktime' : /\.mp4$/i.test(f.name) ? 'video/mp4' : '')
  const s = await signUpload(type, f.size)
  if (s.error || !s.upload || !s.url) return { error: s.error ?? 'Upload failed.' }
  // XMLHttpRequest instead of fetch so big videos can show progress
  const ok = await new Promise<boolean>((resolve) => {
    const x = new XMLHttpRequest()
    x.open('PUT', s.upload!)
    x.setRequestHeader('content-type', type)
    x.setRequestHeader('x-upsert', 'false')
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)) }
    x.onload = () => resolve(x.status >= 200 && x.status < 300)
    x.onerror = () => resolve(false)
    x.send(f)
  })
  return ok ? { url: s.url } : { error: 'Upload failed. Check your connection and try again.' }
}

/** One PDF (or video): upload / replace / remove. Posts its URL under `name`. */
export function FileField({ name, value, kind = 'pdf', onChange, label }: { name?: string; value: string; kind?: 'pdf' | 'video'; onChange?: (v: string) => void; label?: string }) {
  const [val, setVal] = useState(value)
  const [busy, setBusy] = useState<number | null>(null)
  const [err, setErr] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const set = (v: string) => { setVal(v); onChange?.(v) }
  async function pick(f: File | undefined) {
    if (!f) return
    setErr(''); setBusy(0)
    const r = await sendFile(f, setBusy)
    setBusy(null)
    if (r.error) setErr(r.error); else if (r.url) set(r.url)
    if (input.current) input.current.value = ''
  }
  const fname = val ? decodeURIComponent(val.split('/').pop() || '') : ''
  return (
    <div className="ad-file">
      {name && <input type="hidden" name={name} value={val} />}
      <span className="ad-file-ic"><Icon name={kind === 'pdf' ? 'file' : 'video'} size={20} /></span>
      <div className="ad-file-t">
        {val ? <a href={val} target="_blank" rel="noopener">{label ?? (kind === 'pdf' ? 'Itinerary PDF' : 'Video')} <small>{fname}</small></a> : <span className="hint" style={{ margin: 0 }}>{kind === 'pdf' ? 'No PDF uploaded' : 'No video uploaded'}</span>}
        {busy !== null && <span className="ad-file-bar"><span style={{ width: `${busy}%` }} /></span>}
        {err && <span style={{ color: 'var(--bad)', fontSize: 13 }}>{err}</span>}
      </div>
      <input ref={input} type="file" hidden accept={kind === 'pdf' ? 'application/pdf' : 'video/mp4,video/quicktime,video/webm'} onChange={(e) => pick(e.target.files?.[0])} />
      <button type="button" className="btn b-ghost sm" disabled={busy !== null} onClick={() => input.current?.click()}>{busy !== null ? `Uploading ${busy}%` : val ? 'Replace' : kind === 'pdf' ? 'Upload PDF' : 'Upload video'}</button>
      {val && busy === null && <button type="button" className="btn b-ghost sm" onClick={() => set('')}>Remove</button>}
    </div>
  )
}
